import { User } from "src/user/entities/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";

@Entity()
export class Session {
  @PrimaryGeneratedColumn("increment", { name: "sessionid" })
  sessionId: number;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userid" })
  userId: number;

  @Column({ name: "jwttoken" })
  jwtToken: string;

  @Column({ name: "issuedat" })
  issuedAt: string;
}
