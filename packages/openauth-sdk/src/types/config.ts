import mongoose from 'mongoose';

/**
 * Injection blueprint for user-supplied database entities
 */
export interface OpenAuthModels {
  UserModel: mongoose.Model<any>;
  OrgModel: mongoose.Model<any>;
  MembershipModel: mongoose.Model<any>;
}

/**
 * Global operational framework state shared down into isolated module actions
 */
export interface OpenAuthContext extends OpenAuthModels {
  secret: string;
}

/**
 * Structural matrix mapping directly to dynamic schema properties inside the AuthSettings collection
 */
export interface OpenAuthConfigMatrix {
  settings: {
    sessionDuration: string;
    organizations: {
      enabled: boolean;
      allowUserCreate?: boolean;
      autoCreateOnSignup?: boolean;
      defaultMaxMembers?: number;
    };
    allowUserSignups: boolean;
  };
  providers: {
    github: { enabled: boolean };
    google: { enabled: boolean };
  };
}