export type RoleType = "admin" | "customer";

export interface User {
  id: string;
  username: string;
  role: RoleType;
  createdAt: string;
  updatedAt: string;
}
