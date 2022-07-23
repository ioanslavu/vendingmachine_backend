import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { jwtDecodedToken } from "src/auth/models/jwt-token.model";
import { Response } from "express";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.userService.create(createUserDto);
    if (user.status === true) {
      res.status(HttpStatus.CREATED).json(user);
    } else {
      res.status(HttpStatus.OK).json(user);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(@Req() req, @Param("id") id: string) {
    const decodedToken: jwtDecodedToken = req.user;
    if (decodedToken.userId !== +id) {
      throw new UnauthorizedException();
    }
    return await this.userService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  async update(
    @Req() req,
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const decodedToken: jwtDecodedToken = req.user;
    if (decodedToken.userId !== +id) {
      throw new UnauthorizedException();
    }
    return await this.userService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(@Req() req, @Param("id") id: string) {
    const decodedToken: jwtDecodedToken = req.user;
    if (decodedToken.userId !== +id) {
      throw new UnauthorizedException();
    }
    return await this.userService.remove(+id);
  }
}
