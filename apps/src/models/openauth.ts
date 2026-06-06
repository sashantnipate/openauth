import mongoose, { Schema, Document } from 'mongoose';

// 1. USER MODEL
export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  providers: { githubId?: string; googleId?: string };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: false },
  providers: {
    githubId: { type: String, required: false, sparse: true },
    googleId: { type: String, required: false, sparse: true }
  },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);


// 2. ORGANIZATION MODEL
export interface IOrg extends Document {
  name: string;
  creatorId: mongoose.Types.ObjectId;
  maxMembers: number;
  createdAt: Date;
}

const OrgSchema = new Schema<IOrg>({
  name: { type: String, required: true },
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  maxMembers: { type: Number, default: 5 }, 
  createdAt: { type: Date, default: Date.now },
});

export const OrgModel = mongoose.models.Organization || mongoose.model<IOrg>('Organization', OrgSchema);


// 3. MEMBERSHIP MODEL (Junction Collection)
export interface IMembership extends Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
});

// Crucial indexing layers to enforce safety rules and maintain high-performance lookups
MembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1 });

export const MembershipModel = mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
