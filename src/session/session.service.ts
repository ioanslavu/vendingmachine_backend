import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Session } from "src/session/entities/session.entity";
import { Repository } from "typeorm";

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>
  ) {}

  create(token: string, userId: number, issuedAt: string) {
    const session = new Session();
    session.jwtToken = token;
    session.issuedAt = issuedAt;
    session.userId = userId;
    return this.sessionRepository.save(session);
  }

  count(userId: number) {
    return this.sessionRepository.count({ where: { userId } });
  }

  async findOne(token: string) {
    return await this.sessionRepository.findOne({ where: { jwtToken: token } });
  }

  delete(token: string) {
    return this.sessionRepository.delete({ jwtToken: token });
  }

  async deleteAll(userId: number) {
    console.log(userId);
    return await this.sessionRepository.delete({ userId });
  }
}
