import { UserRepository, User } from "@openauth/sdk";
import { UserModel } from "../models/User.model";
import { AnyObject } from "mongoose";

export class MongoUserRepository implements UserRepository {
  // Map an incoming plain document object strictly to your SDK contract
  private mapDocument(doc: AnyObject): User {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      passwordHash: doc.passwordHash,
      providers: doc.providers || {},
      canCreateOrganizations: !!doc.canCreateOrganizations,
      createdAt: doc.createdAt,
    };
  }

  async create(data: Omit<User, "id">): Promise<User> {
    const doc = await UserModel.create(data);
    return this.mapDocument(doc.toObject());
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean().exec();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).lean().exec();
    return doc ? this.mapDocument(doc) : null;
  }

  async update(id: string, data: Partial<Omit<User, "id">>): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(
      id, 
      { $set: data }, 
      { new: true }
    ).lean().exec();
    
    if (!doc) throw new Error("User registration document not found for updating.");
    return this.mapDocument(doc);
  }

  async delete(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id).exec();
  }
}