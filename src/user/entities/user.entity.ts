import { Session } from "src/session/entities/session.entity";
import { Product } from "src/product/entities/product.entity";
import { Role } from "src/user/roles/roles.enum";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Exclude } from "class-transformer";

@Entity()
export class User {
  @PrimaryGeneratedColumn("increment", { name: "userid" })
  userId: number;

  @Column({ name: "username" })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: "deposit", default: 0 })
  deposit: number;

  @Column({
    type: "enum",
    enum: Role,
  })
  role: Role;

  @OneToMany(() => Session, (session) => session.userId)
  sessions: Session[];

  @OneToMany(() => Product, (product) => product.sellerId)
  products: Product[];
}
