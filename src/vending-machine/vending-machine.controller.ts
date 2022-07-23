import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import RoleGuard from "src/auth/guards/role.guard";
import { jwtDecodedToken } from "src/auth/models/jwt-token.model";
import { Role } from "src/user/roles/roles.enum";
import { BuyDto } from "src/vending-machine/dto/buy.dto";
import { DepositDto } from "src/vending-machine/dto/deposit.dto";
import { VendingMachineService } from "src/vending-machine/vending-machine.service";

@Controller("")
export class VendingMachineController {
  constructor(private readonly vendingMachineService: VendingMachineService) {}

  @Post("/deposit")
  @HttpCode(200)
  @UseGuards(RoleGuard(Role.Buyer))
  async deposit(@Req() req, @Body() depositDto: DepositDto) {
    const decodedToken: jwtDecodedToken = req.user;
    return await this.vendingMachineService.deposit(
      decodedToken.userId,
      depositDto.amount
    );
  }

  @Post("/reset")
  @HttpCode(200)
  @UseGuards(RoleGuard(Role.Buyer))
  async reset(@Req() req) {
    const decodedToken: jwtDecodedToken = req.user;
    return await this.vendingMachineService.reset(decodedToken.userId);
  }

  @Post("/buy")
  @HttpCode(200)
  @UseGuards(RoleGuard(Role.Buyer))
  async buy(@Req() req, @Body() buyDto: BuyDto) {
    const decodedToken: jwtDecodedToken = req.user;
    return await this.vendingMachineService.buy(
      decodedToken.userId,
      buyDto.productId,
      buyDto.amount
    );
  }
}
