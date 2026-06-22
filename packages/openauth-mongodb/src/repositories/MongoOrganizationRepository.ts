import { OrganizationRepository, Organization } from "@openauth/sdk";
import { OrganizationModel } from "../models/Organization.model";
import { Types } from "mongoose";

export class MongoOrganizationRepository implements OrganizationRepository {
  private mapDocument(doc: any): Organization {
    return {
      id: doc._id.toString(),
      name: doc.name,
      creatorId: doc.creatorId.toString(),
      maxMembers: doc.maxMembers,
      createdAt: doc.createdAt,
    };
  }

  async create(data: Omit<Organization, "id">): Promise<Organization> {
    const doc = await OrganizationModel.create({
      name: data.name,
      creatorId: new Types.ObjectId(data.creatorId),
      maxMembers: data.maxMembers,
      createdAt: data.createdAt,
    });
    return this.mapDocument(doc.toObject());
  }

  async findById(id: string): Promise<Organization | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await OrganizationModel.findById(id).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByName(name: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findOne({ name }).lean();
    return doc ? this.mapDocument(doc) : null;
  }

  async findByCreatorId(userId: string): Promise<Organization[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const docs = await OrganizationModel.find({ creatorId: new Types.ObjectId(userId) }).lean();
    return docs.map(this.mapDocument);
  }

  async update(id: string, data: Partial<Omit<Organization, "id">>): Promise<Organization> {
    const updatePayload: any = { ...data };
    if (data.creatorId) updatePayload.creatorId = new Types.ObjectId(data.creatorId);

    const doc = await OrganizationModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).lean();
    
    if (!doc) throw new Error("Organization not found.");
    return this.mapDocument(doc);
  }

  async delete(id: string): Promise<void> {
    await OrganizationModel.findByIdAndDelete(id);
  }
}