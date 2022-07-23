import {
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "src/auth/auth.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { LocalAuthGuard } from "src/auth/guards/local-auth.guard";
import { SessionService } from "src/session/session.service";
import { UserService } from "src/user/user.service";

@Controller("")
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private userService: UserService
  ) {}

  @Post("login")
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    let message = "";
    const user = req.user;
    const activeSessions = await this.sessionService.count(user.userId);
    if (activeSessions > 0) {
      message = "There is already an active session using your account";
    }
    const token = await this.authService.login(user);
    await res.cookie("auth-cookie", token, {
      httpOnly: true,
      //   sameSite: true,
      //   secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    const decodedToken = this.authService.decodeToken(token);
    await this.sessionService.create(
      token,
      decodedToken.userId,
      decodedToken.iat
    );
    return {
      username: user.username,
      role: user.role,
      deposit: user.deposit,
      message: message,
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies["auth-cookie"];
    this.sessionService.delete(token);
    res.clearCookie("auth-cookie");
    return { message: "Logout successful" };
  }

  @Post("logout/all")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logoutAll(@Req() req, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    const activeSessions = await this.sessionService.count(user.userId);
    if (activeSessions > 0) {
      await this.sessionService.deleteAll(user.userId);
    }
    res.clearCookie("auth-cookie");
    return { message: "Logout all active sessions successful" };
  }

  @Post("/me")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async me(@Req() req) {
    const user = req.user;
    const userData = await this.userService.findOne(user.userId);
    return {
      username: userData.username,
      role: userData.role,
      deposit: userData.deposit,
    };
  }
}
