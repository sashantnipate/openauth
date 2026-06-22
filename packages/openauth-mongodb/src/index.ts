import { OpenAuthAdapter } from "@openauth/sdk";
import { MongoUserRepository } from "./repositories/MongoUserRepository";
import { MongoOrganizationRepository } from "./repositories/MongoOrganizationRepository";
import { MongoMembershipRepository } from "./repositories/MongoMembershipRepository";
import { MongoOAuthRepository } from "./repositories/MongoOAuthRepository";
import { MongoSessionRepository } from "./repositories/MongoSessionRepository";

// Cleanly export underlying schemas and models so your dashboard apps can read them without duplicate declarations
export { AuthConfigModel } from "./models/Config.model";
export { SessionModel } from "./models/Session.model";
export { UserModel } from "./models/User.model";

export class MongooseOpenAuthAdapter implements OpenAuthAdapter {
  public readonly users = new MongoUserRepository();
  public readonly organizations = new MongoOrganizationRepository();
  public readonly organizationMemberships = new MongoMembershipRepository();
  public readonly oauthAccounts = new MongoOAuthRepository();
  public readonly sessions = new MongoSessionRepository();
}