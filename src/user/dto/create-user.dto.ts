import { Role } from "src/user/roles/roles.enum";

export class CreateUserDto {
  username: string;
  password: string;
  role: Role;
  deposit?: number;
}
