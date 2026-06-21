import { OpenAuth } from '../OpenAuth';
import { generateToken } from '../utils/jwt';

export async function handleGoogleCallbackAction(
  auth: OpenAuth,
  input: { code: string; redirectUri: string }
) {
  // 1. Assert provider status flags inside internal configurations
  if (!auth.config.providers.google.enabled) {
    throw new Error("Google single sign-on provider is currently deactivated.");
  }

  const clientId = auth.config.providers.google.clientId;
  const clientSecret = auth.config.providers.google.clientSecret;

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

  // 4. Sync profile information via repository adapters
  let user = null;
  const linkedAccount = await auth.adapter.oauthAccounts.findByProvider("google", googleIdString);

  if (linkedAccount) {
    user = await auth.adapter.users.findById(linkedAccount.userId);
  }

  if (!user) {
    // Deduplicate profiles using email lookup strategies
    user = await auth.adapter.users.findByEmail(googleEmailNormalized);

    if (user) {
      // Link Google credentials to existing email profile
      await auth.adapter.oauthAccounts.create({
        userId: user.id,
        provider: "google",
        providerUserId: googleIdString,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      if (!auth.config.auth.allowUserSignups) {
        throw new Error("Registration is disabled. New Google identity generation operations halted.");
      }

      user = await auth.adapter.users.create({
        email: googleEmailNormalized,
        name: googleUser.name || "Google User",
        providers: { google: googleIdString },
        canCreateOrganizations: true,
        createdAt: new Date()
      });

      // Establish initial provider map linkage link
      await auth.adapter.oauthAccounts.create({
        userId: user.id,
        provider: "google",
        providerUserId: googleIdString,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // 5. Build and return authorization session strings using built-in utilities
  const encryptionSecret = (auth.config as any).secret || "fallback_system_secret_key";
  const token = generateToken(
    { userId: user.id },
    encryptionSecret,
    auth.config.auth.session.duration as any
  );

  return {
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      canCreateOrganizations: user.canCreateOrganizations
    },
    token,
    organization: null,
  };
}