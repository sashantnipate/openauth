export interface OrganizationEntity {
  _id: any;
  name: string;
  creatorId: any;
  maxMembers: number;
  createdAt: Date;
}

export interface MembershipEntity {
  _id: any;
  orgId: any;
  userId: any;
  role: 'admin' | 'member';
  joinedAt: Date;
}