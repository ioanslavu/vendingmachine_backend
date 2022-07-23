import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { SessionService } from "src/session/session.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly sessionService: SessionService) {
    super({
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: process.env.SECRET_KEY,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // const data = request?.cookies["auth-cookie"];
          const data = request?.headers["cookie"];
          const token = data?.split("=")[1];
          if (!token) {
            return null;
          }
          return token;
        },
      ]),
    });
  }

  async validate(req: Request, payload: any) {
    const data = req?.headers["cookie"];
    const token = data?.split("=")[1];
    if (payload === null && token === null) {
      throw new UnauthorizedException();
    }
    const findOne = await this.sessionService.findOne(token);
    if (!findOne) {
      throw new UnauthorizedException("invalid token");
    }
    return payload;
  }
}
