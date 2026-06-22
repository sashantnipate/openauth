import { OpenAuthAdapter, SessionRepository } from "@openauth/sdk";
import { MongoUserRepository } from "./repositories/MongoUserRepository";
import { MongoOrganizationRepository } from "./repositories/MongoOrganizationRepository";
import { MongoMembershipRepository } from "./repositories/MongoMembershipRepository";
import { MongoOAuthRepository } from "./repositories/MongoOAuthRepository";

// Dummy session repo fallback stub (replace with a genuine token session collection if required)
class DummySessionRepository implements SessionRepository {
  async create(data: any): Promise<any> { return data; }
  async findById(id: string): Promise<any> { return null; }
  async findByToken(token: string): Promise<any> { return null; }
  async findByUserId(userId: string): Promise<any[]> { return []; }
  async update(id: string, data: any): Promise<any> { return data; }
  async delete(id: string): Promise<void> {}
  async deleteByUserId(userId: string): Promise<void> {}
  async deleteExpired(): Promise<void> {}
}

export class MongooseOpenAuthAdapter implements OpenAuthAdapter {
  public users = new MongoUserRepository();
  public organizations = new MongoOrganizationRepository();
  public organizationMemberships = new MongoMembershipRepository();
  public oauthAccounts = new MongoOAuthRepository();
  public sessions = new DummySessionRepository();
}