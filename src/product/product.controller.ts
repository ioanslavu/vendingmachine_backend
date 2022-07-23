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
  ForbiddenException,
} from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

import { Role } from "src/user/roles/roles.enum";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { jwtDecodedToken } from "src/auth/models/jwt-token.model";
import RoleGuard from "src/auth/guards/role.guard";

@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(RoleGuard(Role.Seller))
  async create(@Req() req, @Body() createProductDto: CreateProductDto) {
    const decodedToken: jwtDecodedToken = req.user;
    return await this.productService.create(
      createProductDto,
      decodedToken.userId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return await this.productService.findAll();
  }

  @Get("/my")
  @UseGuards(RoleGuard(Role.Seller))
  async findMy(@Req() req) {
    const decodedToken: jwtDecodedToken = req.user;
    return await this.productService.findMy(decodedToken.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(RoleGuard(Role.Seller))
  async update(
    @Req() req,
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    const decodedToken: jwtDecodedToken = req.user;
    if (await this.productService.verifySeller(+id, decodedToken.userId)) {
      return await this.productService.update(+id, updateProductDto);
    } else {
      throw new ForbiddenException();
    }
  }

  @Delete(":id")
  @UseGuards(RoleGuard(Role.Seller))
  async remove(@Req() req, @Param("id") id: string) {
    const decodedToken: jwtDecodedToken = req.user;
    if (await this.productService.verifySeller(+id, decodedToken.userId)) {
      return await this.productService.remove(+id);
    } else {
      throw new ForbiddenException();
    }
  }
}
