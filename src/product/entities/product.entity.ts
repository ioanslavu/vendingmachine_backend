import { User } from "src/user/entities/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("increment", { name: "productid" })
  productId: number;

  @Column({ name: "amountavailable" })
  amountAvailable: number;

  @Column({ name: "cost", default: 0 })
  cost: number;

  @Column({ name: "productname" })
  productName: string;

  @ManyToOne(() => User, (user) => user.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sellerId" })
  seller: number;

  @Column()
  sellerId: number;
}
