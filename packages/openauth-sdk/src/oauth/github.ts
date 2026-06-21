import { OpenAuth } from '../OpenAuth';
import { generateToken } from '../utils/jwt';

export async function handleGitHubCallbackAction(
  auth: OpenAuth,
  input: { code: string }
) {
  // 1. Guard check to make sure the provider is enabled in configurations
  if (!auth.config.providers.github.enabled) {
    throw new Error("GitHub single sign-on provider is currently disabled.");
  }

  const clientId = auth.config.providers.github.clientId;
  const clientSecret = auth.config.providers.github.clientSecret;

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
  const userEmail = githubUser.email?.toLowerCase().trim();
  
  // 4. Look up internal user tables via the repository interface contract
  // First, check if this GitHub account is already linked to an existing profile
  let user = null;
  const linkedAccount = await auth.adapter.oauthAccounts.findByProvider("github", githubIdString);

  if (linkedAccount) {
    user = await auth.adapter.users.findById(linkedAccount.userId);
  }

  if (!user && userEmail) {
    // Fall back to looking up matching email entries to prevent split account bugs
    user = await auth.adapter.users.findByEmail(userEmail);
    if (user) {
      // Link the OAuth account to the existing user profile
      await auth.adapter.oauthAccounts.create({
        userId: user.id,
        provider: "github",
        providerUserId: githubIdString,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  if (!user) {
    // Create a brand new account if no existing record matches
    if (!auth.config.auth.allowUserSignups) {
      throw new Error("Registration is restricted. New user generation blocks are active.");
    }

    user = await auth.adapter.users.create({
      email: userEmail || `${githubIdString}@github.openauth.local`,
      name: githubUser.name || githubUser.login || "GitHub User",
      providers: { github: githubIdString },
      canCreateOrganizations: true,
      createdAt: new Date()
    });

    // Link the new OAuth record
    await auth.adapter.oauthAccounts.create({
      userId: user.id,
      provider: "github",
      providerUserId: githubIdString,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 5. Generate secure crypt token response maps using your built-in utility
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