import jwt from 'jsonwebtoken';
import { OpenAuthContext } from '../types/config';
import { getLiveDatabaseConfig } from '../utils/config';

export async function handleGoogleCallbackAction(
  ctx: OpenAuthContext,
  input: { code: string; redirectUri: string }
) {
  const config = await getLiveDatabaseConfig();

  // 1. Assert provider status flags inside internal configurations
  if (!config.providers?.google?.enabled) {
    throw new Error("Google single sign-on provider is currently deactivated.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("🚨 [openAuth] Google client parameters are missing from active environments.");
  }

  // 2. Resolve access tokens from Google API endpoints
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(tokenData.error_description || "Failed to exchange Google OAuth parameters.");
  }

  // 3. Fetch metadata claims securely using access token profiles
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const googleUser = await profileResponse.json();
  if (!googleUser.id) {
    throw new Error("Failed to extract explicit identifier keys from the Google verification server.");
  }

  const googleIdString = googleUser.id.toString();
  const googleEmailNormalized = googleUser.email.toLowerCase().trim();

  // 4. Sync profile information with your MongoDB collections
  let user = await ctx.UserModel.findOne({ "providers.googleId": googleIdString });

  if (!user) {
    // Deduplicate profiles using email lookup strategies
    user = await ctx.UserModel.findOne({ email: googleEmailNormalized });

    if (user) {
      user.providers.googleId = googleIdString;
      await user.save();
    } else {
      if (!config.settings.allowUserSignups) {
        throw new Error("Registration is disabled. New Google identity generation operations halted.");
      }

      user = await ctx.UserModel.create({
        email: googleEmailNormalized,
        name: googleUser.name || "Google User",
        providers: { googleId: googleIdString },
        canCreateOrganizations: true,
      });
    }
  }

  // 5. Build and return authorization session strings
  const token = jwt.sign({ userId: user._id.toString() }, ctx.secret, {
    expiresIn: config.settings.sessionDuration as any,
  });

  return {
    user: { id: user._id, email: user.email, name: user.name },
    token,
    organization: null,
  };
}