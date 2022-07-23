import { Test, TestingModule } from "@nestjs/testing";
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import * as request from "supertest";
import { User } from "../src/user/entities/user.entity";
import { Product } from "../src/product/entities/product.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "../src/user/dto/create-user.dto";
import { Role } from "../src/user/roles/roles.enum";
import { AppModule } from "src/app.module";
import { Session } from "src/session/entities/session.entity";
import { Reflector } from "@nestjs/core";

describe("UserController (e2e)", () => {
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let sessionRepository: Repository<Session>;
  let app: INestApplication;
  const buyerDto: CreateUserDto = {
    username: "ioan",
    password: "password",
    role: Role.Buyer,
    deposit: 0,
  };
  const sellerDto: CreateUserDto = {
    username: "John",
    password: "password",
    role: Role.Seller,
    deposit: 0,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector))
    );
    app.init();
    productRepository = moduleFixture.get("ProductRepository");
    userRepository = moduleFixture.get("UserRepository");
    sessionRepository = moduleFixture.get("SessionRepository");
  });

  it("/user (POST) --> 201 Created - Create account with correct data for buyer role", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send(buyerDto)
      .expect(201)
      .expect({
        userId: 1,
        status: true,
      });
  });

  it("/user (POST) --> 201 Created - Create account with correct data for seller role", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send(sellerDto)
      .expect(201)
      .expect({
        userId: 2,
        status: true,
      });
  });

  it("/user (POST) --> 201 Created  - Create account without deposit field", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "somethingunique1",
        password: "somethingpassword",
        role: Role.Buyer,
      })
      .expect(201)
      .expect({
        userId: 3,
        status: true,
      });
  });
  it("/user (POST) --> 201 Created  - Create account with deposit more than 0 but correct", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "somethingunique3",
        password: "somethingpassword",
        role: Role.Buyer,
        deposit: 10,
      })
      .expect(201)
      .expect({
        userId: 4,
        status: true,
      });
  });

  it("/user (POST) --> 200 OK  - Should not create account with existing username", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send(buyerDto)
      .expect(200)
      .expect({
        message: "User already exists",
        status: false,
      });
  });

  it("/user (POST) --> 200 OK  - Should not create account with empty username", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "",
        password: "password",
        role: Role.Buyer,
        deposit: 0,
      })
      .expect(200)
      .expect({
        message: "Username is required",
        status: false,
      });
  });

  it("/user (POST) --> 200 OK  - Should not create account with empty password", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "somethingunique4",
        password: "",
        role: Role.Buyer,
        deposit: 0,
      })
      .expect(200)
      .expect({
        message: "Password is required",
        status: false,
      });
  });

  it("/user (POST) --> 200 OK  - Should not create account with empty role", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "somethingunique5",
        password: "somethingpassword",
        role: "",
        deposit: 0,
      })
      .expect(200)
      .expect({
        message: "Role must be buyer or seller",
        status: false,
      });
  });

  it("/user (POST) --> 200 OK  - Should not create account with buyer role and deposit amount not in [0, 5, 10, 20, 50, 100]", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "somethingunique6",
        password: "somethingpassword",
        role: Role.Buyer,
        deposit: 8,
      })
      .expect(200)
      .expect({
        message: "Deposit must be in 5, 10, 20, 50 or 100 cent coins",
        status: false,
      });
  });

  it("/user (POST) --> 200 OK  - Should not create account with seller role and deposit more than 0", async () => {
    return await request(app.getHttpServer())
      .post("/user")
      .send({
        username: "somethingunique6",
        password: "somethingpassword",
        role: Role.Seller,
        deposit: 10,
      })
      .expect(200)
      .expect({
        message: "Only buyers can deposit",
        status: false,
      });
  });

  it("/user (`GET`) --> 200 OK - Authenticate and request my user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .get("/user/1")
      .set("cookie", authCookie)
      .expect(200)
      .expect({
        userId: 1,
        username: "ioan",
        deposit: 0,
        role: Role.Buyer,
      });
  });

  it("/user (`GET`) --> 401 Unauthorized - Authenticate and send a string as param", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .get("/user/ad")
      .set("cookie", authCookie)
      .expect(401);
  });

  it("/user (`GET`) --> 401 Unauthorized - Authenticate and request another registered user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .get("/user/2")
      .set("cookie", authCookie)
      .expect(401);
  });

  it("/user (`GET`) --> 401 Unauthorized - Authenticate and request a not registered user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .get("/user/3")
      .set("cookie", authCookie)
      .expect(401);
  });

  it("/user (`GET`) --> 401 Unauthorized - Unauthenticated and request user", async () => {
    return await request(app.getHttpServer()).get("/user/2").expect(401);
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and update my user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({
        username: "ioan",
        password: "password",
        role: Role.Buyer,
        deposit: 10,
      })
      .expect(200)
      .expect({
        userId: 1,
        status: true,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user with empty username", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({
        username: "",
        password: "password",
        role: Role.Buyer,
        deposit: 0,
      })
      .expect(200)
      .expect({
        message: "Username is required",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user with empty password", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ password: "", role: Role.Buyer, deposit: 0 })
      .expect(200)
      .expect({
        message: "Password is required",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user with empty role", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ role: "" })
      .expect(200)
      .expect({
        message: "Role is required",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user with wrong role", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ role: "buer" })
      .expect(200)
      .expect({
        message: "Role must be buyer or seller",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user(buyer) with wrong deposit amount not in [ 5, 10, 20, 50, 100]", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ deposit: 4 })
      .expect(200)
      .expect({
        message: "Deposit must be in 5, 10, 20, 50 or 100 cent coins",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user(buyer) with wrong deposit amount = 0", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "somethingunique3", password: "somethingpassword" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/4")
      .set("cookie", authCookie)
      .send({ deposit: 0 })
      .expect(200)
      .expect({ userId: 4, status: true });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user(buyer) with wrong deposit amount negative", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ deposit: -2 })
      .expect(200)
      .expect({
        message: "Deposit must be in 5, 10, 20, 50 or 100 cent coins",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user(seller) with deposit amount != 0", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "John", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/2")
      .set("cookie", authCookie)
      .send({ deposit: 10 })
      .expect(200)
      .expect({
        message: "Only buyers can deposit",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my user(buyer) as seller with new deposit amount != 0", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ role: Role.Seller, deposit: 10 })
      .expect(200)
      .expect({
        message: "Only buyers can deposit",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 200 OK - Authenticate and should not update my username if the new one already exist", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/1")
      .set("cookie", authCookie)
      .send({ username: "John" })
      .expect(200)
      .expect({
        message: "User already exists",
        status: false,
      });
  });

  it("/user (`PATCH`) --> 401 Unauthorized - Authenticate and should not update another registered user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/2")
      .set("cookie", authCookie)
      .send({ username: "someone" })
      .expect(401);
  });

  it("/user (`PATCH`) --> 401 Unauthorized - Authenticate and should not update a not registered user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .patch("/user/10")
      .set("cookie", authCookie)
      .send({ username: "someone" })
      .expect(401);
  });

  it("/user (`PATCH`) --> 401 Unauthorized - Unauthenticated and should not update", async () => {
    return await request(app.getHttpServer())
      .patch("/user/1")
      .send({ username: "someone" })
      .expect(401);
  });

  it("/user (`DELETE`) --> 200 OK - Authenticate and delete me", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "somethingunique3", password: "somethingpassword" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .delete("/user/4")
      .set("cookie", authCookie)
      .expect(200);
  });

  it("/user (`DELETE`) --> 401 Unauthorized - Unauthenticated, should not delete", async () => {
    return await request(app.getHttpServer()).delete("/user/2").expect(401);
  });

  it("/user (`DELETE`) --> 401 Unauthorized - Authenticate and send a string as param", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .delete("/user/2")
      .set("cookie", authCookie)
      .expect(401);
  });

  it("/user (`DELETE`) --> 401 Unauthorized - Authenticate and should not delete another registered user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .delete("/user/2")
      .set("cookie", authCookie)
      .expect(401);
  });

  it("/user (`DELETE`) --> 401 Unauthorized - Authenticate and should not delete a not registered user", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .delete("/user/10")
      .set("cookie", authCookie)
      .expect(401);
  });

  it("/deposit (`POST`) --> 200 OK - Authenticate as buyer and deposit correct amount", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .post("/deposit")
      .send({ amount: 10 })
      .set("cookie", authCookie)
      .expect(200);
  });

  it("/deposit (`POST`) --> 400 Bad Request - Authenticate as buyer and should not deposit negative amount", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .post("/deposit")
      .send({ amount: -10 })
      .set("cookie", authCookie)
      .expect(400);
  });

  it("/deposit (`POST`) --> 400 Bad Request - Authenticate as buyer and should not deposit amount not in [0, 5, 10, 20, 50, 100]", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .post("/deposit")
      .send({ amount: 13 })
      .set("cookie", authCookie)
      .expect(400);
  });

  it("/deposit (`POST`) --> 403 Forbidden - Authenticate as seller and should not deposit", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "John", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .post("/deposit")
      .send({ amount: 13 })
      .set("cookie", authCookie)
      .expect(403);
  });

  it("/deposit (`POST`) --> 401 Unauthorized - Unauthenticated and should not deposit", async () => {
    return await request(app.getHttpServer())
      .post("/deposit")
      .send({ amount: 13 })
      .expect(401);
  });

  it("/buy (`POST`) --> 200 OK - Authenticate as buyer and buy products", async () => {
    await productRepository.save({
      productName: "Product 1",
      cost: 5,
      amountAvailable: 4,
      sellerId: 1,
    });
    await productRepository.save({
      productName: "Product 2",
      cost: 2,
      amountAvailable: 3,
      sellerId: 1,
    });
    await productRepository.save({
      productName: "Product 3",
      cost: 100,
      amountAvailable: 2,
      sellerId: 1,
    });
    await productRepository.save({
      productName: "Product 4",
      cost: 10,
      amountAvailable: 0,
      sellerId: 1,
    });

    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];
    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 1, amount: 1 })
      .set("cookie", authCookie)
      .expect(200)
      .expect({
        amount: 1,
        product: "Product 1",
        change: [5, 10],
      });
  });

  it("/buy (`POST`) --> 400 Bad Request - Authenticate as buyer and should not buy products that cost more than my deposit", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 3, amount: 1 })
      .set("cookie", authCookie)
      .expect(400)
      .expect({
        statusCode: 400,
        message: "Not enough money",
        error: "Bad Request",
      });
  });

  it("/buy (`POST`) --> 400 Bad Request - Authenticate as buyer and should not buy more products than available", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];
    await userRepository.update(1, { deposit: 50 });
    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 2, amount: 5 })
      .set("cookie", authCookie)
      .expect(400)
      .expect({
        statusCode: 400,
        message: "Not enough products",
        error: "Bad Request",
      });
  });

  it("/buy (`POST`) --> 400  Bad Request - Authenticate as buyer and should not buy an out of stock product", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];
    await userRepository.update(1, { deposit: 50 });
    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 4, amount: 3 })
      .set("cookie", authCookie)
      .expect(400)
      .expect({
        statusCode: 400,
        message: "Not enough products",
        error: "Bad Request",
      });
  });

  it("/buy (`POST`) --> 404 Not Found - Authenticate as buyer and should not buy a product that does not exist", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "ioan", password: "password" });

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];
    await userRepository.update(1, { deposit: 50 });
    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 9, amount: 3 })
      .set("cookie", authCookie)
      .expect(404)
      .expect({
        statusCode: 404,
        message: "Product not found",
        error: "Not Found",
      });
  });

  it("/buy (`POST`) --> 403 Forbidden - Authenticate as seller and should not buy a product", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/login")
      .send({ username: "John", password: "password" });

    console.log(await userRepository.findOneBy({ userId: 2 }));

    const cookies = loginRes.header["set-cookie"];
    const authCookie = cookies[0].split(";")[0];

    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 2, amount: 3 })
      .set("cookie", authCookie)
      .expect(403);
  });

  it("/buy (`POST`) --> 401 Unauthorized - Unauthenticated and should not buy", async () => {
    return await request(app.getHttpServer())
      .post("/buy")
      .send({ productId: 1, amount: 1 })
      .expect(401);
  });

  afterAll(async () => {
    await sessionRepository.query("DROP TABLE session");
    await productRepository.query("DROP TABLE product");
    await userRepository.query("DROP TABLE user");
    await app.close();
  });
});
