import { SessionRepository, Session } from "@openauth/sdk";
import { SessionModel } from "../models/Session.model";
import { Types, AnyObject } from "mongoose";

export class MongoSessionRepository implements SessionRepository {
  private mapDocument(doc: AnyObject): Session {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      token: doc.token,
      active: !!doc.active,
      userAgent: doc.userAgent,
      ipAddress: doc.ipAddress,
      expiresAt: doc.expiresAt,
      lastActiveAt: doc.lastActiveAt,
      createdAt: doc.createdAt,
    };
  }

  async create(data: Omit<Session, "id">): Promise<Session> {
    const doc = await SessionModel.create({
      userId: new Types.ObjectId(data.userId),
      token: data.token,
      active: data.active,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      expiresAt: data.expiresAt,
      lastActiveAt: data.lastActiveAt,
      createdAt: data.createdAt
    });
    return this.mapDocument(doc.toObject());
  }

  async findById(id: string): Promise<Session | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await SessionModel.findById(id).lean().exec();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const doc = await SessionModel.findOne({ token, active: true }).lean().exec();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const docs = await SessionModel.find({ userId: new Types.ObjectId(userId), active: true }).lean().exec();
    return docs.map(this.mapDocument);
  }

  async update(id: string, data: Partial<Omit<Session, "id">>): Promise<Session> {
    const doc = await SessionModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean().exec();
    if (!doc) throw new Error("Target session token document registration not found.");
    return this.mapDocument(doc);
  }

  async delete(id: string): Promise<void> {
    await SessionModel.findByIdAndDelete(id).exec();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await SessionModel.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
  }

  async deleteExpired(): Promise<void> {
    await SessionModel.deleteMany({ expiresAt: { $lte: new Date() } }).exec();
  }
}