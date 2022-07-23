import { Module } from "@nestjs/common";
import { ProductModule } from "src/product/product.module";
import { UserModule } from "src/user/user.module";
import { VendingMachineController } from "./vending-machine.controller";
import { VendingMachineService } from "./vending-machine.service";

@Module({
  imports: [ProductModule, UserModule],
  controllers: [VendingMachineController],
  providers: [VendingMachineService],
})
export class VendingMachineModule {}
