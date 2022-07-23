import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";
import { ProductService } from "src/product/product.service";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly productService: ProductService
  ) {}

  private async getPasswordHash(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }

  async isPasswordValid(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async validateCreateUser(createUserDto: CreateUserDto) {
    if (!createUserDto.username) {
      return "Username is required";
    }

    if (!createUserDto.password) {
      return "Password is required";
    }

    if (createUserDto.role !== "buyer" && createUserDto.role !== "seller") {
      return "Role must be buyer or seller";
    }

    if (createUserDto.role === "buyer" && createUserDto.deposit) {
      const coins = [100, 50, 20, 10, 5];
      let deposit = createUserDto.deposit;
      for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        const count = Math.floor(deposit / coin);
        deposit -= coin * count;
      }
      if (deposit !== 0) {
        return "Deposit must be in 5, 10, 20, 50 or 100 cent coins";
      }
    }

    if (
      createUserDto.role === "seller" &&
      createUserDto.deposit &&
      createUserDto.deposit !== 0
    ) {
      return "Only buyers can deposit";
    }

    const username = createUserDto.username;
    const user = await this.usersRepository.findOne({ where: { username } });

    if (user && user.username) {
      return "User already exists";
    }

    return null;
  }

  async validateUpdateUser(id: number, updateProductDto: UpdateUserDto) {
    const oldUser = await this.usersRepository.findOneBy({ userId: id });

    if (updateProductDto.username === "") {
      return "Username is required";
    }

    if (updateProductDto.password === "") {
      return "Password is required";
    }

    if (updateProductDto.role === "") {
      return "Role is required";
    }

    if (
      updateProductDto.role &&
      updateProductDto.role !== "buyer" &&
      updateProductDto.role !== "seller"
    ) {
      return "Role must be buyer or seller";
    }

    if (updateProductDto.role) {
      if (
        updateProductDto.role === "buyer" &&
        updateProductDto.deposit &&
        updateProductDto.deposit !== 0
      ) {
        const coins = [100, 50, 20, 10, 5];
        let deposit = updateProductDto.deposit;
        for (let i = 0; i < coins.length; i++) {
          const coin = coins[i];
          const count = Math.floor(deposit / coin);
          deposit -= coin * count;
        }
        if (deposit !== 0) {
          return "Deposit must be in 5, 10, 20, 50 or 100 cent coins";
        }
      }

      if (
        updateProductDto.role === "seller" &&
        updateProductDto.deposit &&
        updateProductDto.deposit !== 0
      ) {
        return "Only buyers can deposit";
      }
    } else {
      if (
        oldUser.role === "buyer" &&
        updateProductDto.deposit &&
        updateProductDto.deposit !== 0
      ) {
        const coins = [100, 50, 20, 10, 5];
        let deposit = updateProductDto.deposit;
        for (let i = 0; i < coins.length; i++) {
          const coin = coins[i];
          const count = Math.floor(deposit / coin);
          deposit -= coin * count;
        }
        if (deposit !== 0) {
          return "Deposit must be in 5, 10, 20, 50 or 100 cent coins";
        }
      }

      if (
        oldUser.role === "seller" &&
        updateProductDto.deposit &&
        updateProductDto.deposit !== 0
      ) {
        return "Only buyers can deposit";
      }
    }

    if (
      updateProductDto.username &&
      updateProductDto.username !== oldUser.username
    ) {
      const username = updateProductDto.username;
      const user = await this.usersRepository.findOne({ where: { username } });

      if (user && user.username) {
        return "User already exists";
      }
    }

    return null;
  }

  async create(createUserDto: CreateUserDto) {
    const errorMessage = await this.validateCreateUser(createUserDto);
    if (errorMessage) {
      return { message: errorMessage, status: false };
    }

    const user = new User();
    user.username = createUserDto.username;
    user.password = await this.getPasswordHash(createUserDto.password);
    user.role = createUserDto.role;
    user.deposit = createUserDto.deposit ? createUserDto.deposit : 0;

    const createdUser = await this.usersRepository.save(user);

    return { userId: createdUser.userId, status: true };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ userId: id });
    if (!user) {
      throw new NotFoundException("User not found.");
    }
    return user;
  }

  async findOneByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ username });
    if (!user) {
      throw new NotFoundException("User not found.");
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ userId: id });
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    const errorMessage = await this.validateUpdateUser(id, updateUserDto);
    if (errorMessage) {
      return { message: errorMessage, status: false };
    }
    if (user.role !== updateUserDto.role) {
      if (updateUserDto.role === "seller") {
        updateUserDto.deposit = 0;
      }
      if (updateUserDto.role === "buyer") {
        this.productService.removeByUser(id);
        updateUserDto.deposit = 0;
      }
    }
    updateUserDto.password = await this.getPasswordHash(updateUserDto.password);
    await this.usersRepository.update(id, updateUserDto);
    return { userId: id, status: true };
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOneBy({ userId: id });
    if (!user) {
      throw new NotFoundException("User not found.");
    }
    await this.usersRepository.delete(id);
    return;
  }
}
