import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ProductService } from "src/product/product.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class VendingMachineService {
  constructor(
    private readonly userService: UserService,
    private readonly productService: ProductService
  ) {}

  async deposit(userId: number, amount: number): Promise<void> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (amount < 0) {
      throw new BadRequestException("Amount must be greater than 0");
    }
    if (![5, 10, 20, 50, 100].includes(amount)) {
      throw new BadRequestException(
        "Deposit must be 5, 10, 20, 50 or 100 cent coins"
      );
    }
    await this.userService.update(userId, {
      deposit: user.deposit + amount,
    });
    return;
  }

  async reset(userId: number): Promise<void> {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException("User not found.");
    }
    await this.userService.update(userId, { deposit: 0 });
    return;
  }

  async buy(userId: number, productId: number, amount: number) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const product = await this.productService.findOne(productId);
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    if (product.amountAvailable < amount) {
      throw new BadRequestException("Not enough products");
    }
    const price = product.cost * amount;
    if (user.deposit < price) {
      throw new BadRequestException("Not enough money");
    }

    await this.userService.update(userId, { deposit: 0 });
    await this.productService.update(productId, {
      amountAvailable: product.amountAvailable - amount,
    });
    const coins = [100, 50, 20, 10, 5];

    // greedy algorithm for change calculation
    let change = user.deposit - price;
    const changeCoins = [];
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      const count = Math.floor(change / coin);
      change -= coin * count;
      for (let j = 0; j < count; j++) {
        changeCoins.push(coin);
      }
    }
    changeCoins.reverse();

    return {
      amount: amount,
      product: product.productName,
      change: changeCoins,
    };
  }
}
