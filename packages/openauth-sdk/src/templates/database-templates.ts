export const USER_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  providers: { githubId?: string; googleId?: string };
  canCreateOrganizations: boolean;
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
  canCreateOrganizations: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
`;

export const ORG_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

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
`;

export const MEMBERSHIP_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

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

MembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1 });

export const MembershipModel = mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
`;

// Add this string constant to packages/openauth-sdk/src/templates/database-templates.ts

export const DB_TEMPLATE = `import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless scope execution fields.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
`;

export const AUTH_SETTINGS_TEMPLATE = `import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthSettings extends Document {
  settings: {
    sessionDuration: string;
    organizations: {
      enabled: boolean;
      allowUserCreate: boolean;
      autoCreateOnSignup: boolean;
      defaultMaxMembers: number;
    };
    allowUserSignups: boolean;
  };
  providers: {
    github: { enabled: boolean };
    google: { enabled: boolean };
  };
}

const AuthSettingsSchema = new Schema<IAuthSettings>({
  settings: {
    sessionDuration: { type: String, default: '1d' },
    organizations: {
      enabled: { type: Boolean, default: false },
      allowUserCreate: { type: Boolean, default: false },
      autoCreateOnSignup: { type: Boolean, default: false },
      defaultMaxMembers: { type: Number, default: 5 }
    },
    allowUserSignups: { type: Boolean, default: true }
  },
  providers: {
    github: { enabled: { type: Boolean, default: false } },
    google: { enabled: { type: Boolean, default: false } }
  }
});

export const AuthSettingsModel = mongoose.models.AuthSettings || mongoose.model<IAuthSettings>('AuthSettings', AuthSettingsSchema);
`;
export const BARREL_TEMPLATE = `export { UserModel } from './User';\nexport { OrgModel } from './Organization';\nexport { MembershipModel } from './Membership';\n`;