import { Role } from "src/user/roles/roles.enum";

export class jwtDecodedToken {
  userId: number;
  issuedAt: string;
  role: Role;
}
