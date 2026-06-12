import mongoose from 'mongoose';

export interface OpenAuthModels {
  UserModel: mongoose.Model<any>;
  OrgModel: mongoose.Model<any>;
  MembershipModel: mongoose.Model<any>;
}

export interface OpenAuthContext extends OpenAuthModels {
  secret: string;
}

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