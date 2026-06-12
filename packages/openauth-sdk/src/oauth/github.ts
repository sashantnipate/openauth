import jwt from 'jsonwebtoken';
import { OpenAuthContext } from '../types/config';
import { getLiveDatabaseConfig } from '../utils/config';

export async function handleGitHubCallbackAction(
  ctx: OpenAuthContext,
  input: { code: string }
) {
  const config = await getLiveDatabaseConfig();

  // 1. Guard check to make sure the provider is enabled in database settings
  if (!config.providers?.github?.enabled) {
    throw new Error("GitHub single sign-on provider is currently disabled.");
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("🚨 [openAuth] GitHub client keys are missing from server configurations.");
  }

  // 2. Exchange authorization code for a secure GitHub OAuth access token
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(tokenData.error_description || "Failed to exchange GitHub authorization credentials.");
  }

  // 3. Fetch public identity payload details using bearer credentials
  const userProfileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
    },
  });

  const githubUser = await userProfileResponse.json();
  if (!githubUser.id) {
    throw new Error("Failed to resolve identity data from the GitHub API profile endpoint.");
  }

  const githubIdString = githubUser.id.toString();
  
  // 4. Look up internal user tables by provider key identity handles
  let user = await ctx.UserModel.findOne({ "providers.githubId": githubIdString });

  if (!user) {
    // Fall back to looking up matching email entries to prevent split account bugs
    const userEmail = githubUser.email?.toLowerCase().trim();
    if (userEmail) {
      user = await ctx.UserModel.findOne({ email: userEmail });
    }

    if (user) {
      // Tie provider key values to original profile records securely
      user.providers.githubId = githubIdString;
      await user.save();
    } else {
      // Create a new account if no existing record matches
      if (!config.settings.allowUserSignups) {
        throw new Error("Registration is restricted. New user generation blocks are active.");
      }

      user = await ctx.UserModel.create({
        email: userEmail || `${githubIdString}@github.openauth.local`,
        name: githubUser.name || githubUser.login || "GitHub User",
        providers: { githubId: githubIdString },
        canCreateOrganizations: true,
      });
    }
  }

  // 5. Generate secure crypt token response maps
  const token = jwt.sign({ userId: user._id.toString() }, ctx.secret, {
    expiresIn: config.settings.sessionDuration as any,
  });

  return {
    user: { id: user._id, email: user.email, name: user.name },
    token,
    organization: null, // Resolves separately during session routing initialization
  };
}