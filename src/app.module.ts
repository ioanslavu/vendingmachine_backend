import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { SessionModule } from './session/session.module'
import { ProductModule } from './product/product.module'
import { VendingMachineModule } from './vending-machine/vending-machine.module'
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        if (process.env.APPLICATION_ENV === 'test') {
          return {
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: process.env.DATABASE_PASSWORD,
            database: 'vending_test',
            autoLoadEntities: true,
            synchronize: true,
            dropSchema: true,
          }
        }
        return {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: process.env.DATABASE_PASSWORD,
          database: 'vending',
          autoLoadEntities: true,
          synchronize: true,
        }
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UserModule,
    SessionModule,
    ProductModule,
    VendingMachineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
