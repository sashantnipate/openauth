import mongoose from 'mongoose';

/**
 * Data blueprint mapping properties representing top-level company or team containers
 */
export interface IOrganizationFields {
  _id: mongoose.Types.ObjectId;
  name: string;
  creatorId: mongoose.Types.ObjectId;
  maxMembers: number;
  createdAt: Date;
}

/**
 * Data blueprint for tenant linkage documents connecting users to workspace units
 */
export interface IMembershipFields {
  _id: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

/**
 * Public payload format describing structural tenant context details
 */
export interface OpenAuthOrgResponse {
  id: string | mongoose.Types.ObjectId;
  name: string;
  role?: 'admin' | 'member' | null;
}