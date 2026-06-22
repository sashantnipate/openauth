import { OrganizationMembershipRepository, OrganizationMembership } from "@openauth/sdk";
import { MembershipModel } from "../models/Membership.model";
import { Types } from "mongoose";

export class MongoMembershipRepository implements OrganizationMembershipRepository {
  private mapDocument(doc: any): OrganizationMembership {
    return {
      id: doc._id.toString(),
      organizationId: doc.organizationId.toString(),
      userId: doc.userId.toString(),
      role: doc.role,
      joinedAt: doc.joinedAt,
    };
  }

  async create(data: Omit<OrganizationMembership, "id">): Promise<OrganizationMembership> {
    const doc = await MembershipModel.create({
      organizationId: new Types.ObjectId(data.organizationId),
      userId: new Types.ObjectId(data.userId),
      role: data.role,
      joinedAt: data.joinedAt,
    });
    return this.mapDocument(doc.toObject());
  }

  async findById(id: string): Promise<OrganizationMembership | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await MembershipModel.findById(id).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByOrganizationAndUser(organizationId: string, userId: string): Promise<OrganizationMembership | null> {
    if (!Types.ObjectId.isValid(organizationId) || !Types.ObjectId.isValid(userId)) return null;
    const doc = await MembershipModel.findOne({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
    }).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<OrganizationMembership[]> {
    if (!Types.ObjectId.isValid(organizationId)) return [];
    const docs = await MembershipModel.find({ organizationId: new Types.ObjectId(organizationId) }).lean();
    return docs.map(this.mapDocument);
  }

  async findByUserId(userId: string): Promise<OrganizationMembership[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const docs = await MembershipModel.find({ userId: new Types.ObjectId(userId) }).lean();
    return docs.map(this.mapDocument);
  }

  async update(id: string, data: Partial<Omit<OrganizationMembership, "id">>): Promise<OrganizationMembership> {
    const doc = await MembershipModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean();
    if (!doc) throw new Error("Membership block registration not found.");
    return this.mapDocument(doc);
  }

  async delete(id: string): Promise<void> {
    await MembershipModel.findByIdAndDelete(id);
  }

  async deleteByOrganizationAndUser(organizationId: string, userId: string): Promise<void> {
    await MembershipModel.deleteOne({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
    });
  }
}