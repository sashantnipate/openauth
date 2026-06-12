export interface UserEntity {
  _id: any;
  email: string;
  name: string;
  passwordHash?: string;
  providers: { githubId?: string; googleId?: string };
  canCreateOrganizations: boolean;
  createdAt: Date;
}