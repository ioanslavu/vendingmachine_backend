import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { jwtDecodedToken } from "src/auth/models/jwt-token.model";
import { UserService } from "src/user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOneByUsername(username);
    if (user && this.userService.isPasswordValid(password, user.password)) {
      return user;
    }
    return null;
  }

  login(user: any) {
    const timestamp = new Date().getTime();
    const payload = { userId: user.userId, role: user.role, iat: timestamp };
    return this.jwtService.sign(payload);
  }

  decodeToken(token: string): jwtDecodedToken | any {
    if (!token) return null;
    return this.jwtService.decode(token);
  }
}
