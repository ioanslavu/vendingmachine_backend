import { CanActivate, ExecutionContext, mixin, Type } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

import { jwtDecodedToken } from "src/auth/models/jwt-token.model";
import { Role } from "src/user/roles/roles.enum";

const RoleGuard = (role: Role): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthGuard {
    async canActivate(context: ExecutionContext) {
      await super.canActivate(context);

      const request = context.switchToHttp().getRequest();
      let decodedToken = new jwtDecodedToken();
      decodedToken = request.user;

      return decodedToken?.role.includes(role);
    }
  }

  return mixin(RoleGuardMixin);
};

export default RoleGuard;
