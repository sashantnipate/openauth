import { OAuthAccountRepository, OAuthAccount, OAuthProvider } from "@openauth/sdk";
import { OAuthAccountModel } from "../models/OAuthAccount.model";
import { Types } from "mongoose";

export class MongoOAuthRepository implements OAuthAccountRepository {
  private mapDocument(doc: any): OAuthAccount {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      provider: doc.provider as OAuthProvider,
      providerUserId: doc.providerUserId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(data: Omit<OAuthAccount, "id">): Promise<OAuthAccount> {
    const doc = await OAuthAccountModel.create({
      userId: new Types.ObjectId(data.userId),
      provider: data.provider,
      providerUserId: data.providerUserId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
    return this.mapDocument(doc.toObject());
  }

  async findById(id: string): Promise<OAuthAccount | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await OAuthAccountModel.findById(id).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByProvider(provider: OAuthProvider, providerUserId: string): Promise<OAuthAccount | null> {
    const doc = await OAuthAccountModel.findOne({ provider, providerUserId }).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByUserId(userId: string): Promise<OAuthAccount[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const docs = await OAuthAccountModel.find({ userId: new Types.ObjectId(userId) }).lean();
    return docs.map(this.mapDocument);
  }

  async update(id: string, data: Partial<Omit<OAuthAccount, "id">>): Promise<OAuthAccount> {
    const doc = await OAuthAccountModel.findByIdAndUpdate(
      id,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    ).lean();
    if (!doc) throw new Error("OAuth account map pointer missing.");
    return this.mapDocument(doc);
  }

  async delete(id: string): Promise<void> {
    await OAuthAccountModel.findByIdAndDelete(id);
  }
}