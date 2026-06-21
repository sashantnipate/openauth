export interface User {

  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  providers: {
    github?: string;
    google?: string;
  };
  canCreateOrganizations: boolean;
  createdAt: Date;
}


export interface OpenAuthUserResponse {

  id: string;
  email: string;
  name: string;
}