import { UserRepository, User } from "@openauth/sdk";
import { UserModel } from "../models/User.model";

export class MongoUserRepository implements UserRepository {
  private mapDocument(doc: any): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      passwordHash: doc.passwordHash,
      providers: doc.providers || {},
      canCreateOrganizations: doc.canCreateOrganizations,
      createdAt: doc.createdAt,
    };
  }

  async create(data: Omit<User, "id">): Promise<User> {
    const doc = await UserModel.create(data);
    return this.mapDocument(doc.toObject());
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async update(id: string, data: Partial<Omit<User, "id">>): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    if (!doc) throw new Error("User not found for updating.");
    return this.mapDocument(doc);
  }

  async delete(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }
}