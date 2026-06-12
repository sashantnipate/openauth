import mongoose from 'mongoose';

/**
 * Structural mirror of basic database document schema values for Users
 */
export interface IUserFields {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash?: string;
  providers: {
    githubId?: string;
    googleId?: string;
  };
  canCreateOrganizations: boolean;
  createdAt: Date;
}

/**
 * Public payload format used for downstream presentation data layers safely stripped of passwords
 */
export interface OpenAuthUserResponse {
  id: string | mongoose.Types.ObjectId;
  email: string;
  name: string;
}