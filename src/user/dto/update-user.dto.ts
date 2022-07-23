import { PartialType } from "@nestjs/mapped-types";
import { Role } from "src/user/roles/roles.enum";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  username?: string;
  password?: string;
  role?: Role | any;
  deposit?: number;
}
