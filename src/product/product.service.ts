import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "src/product/entities/product.entity";
import { Repository } from "typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  async validateCreateProduct(createProductDto: CreateProductDto) {
    if (!createProductDto.productName) {
      return "Product name is required";
    }
    if (!createProductDto.amountAvailable) {
      return "Amount available is required";
    }
    if (!createProductDto.cost) {
      return "Cost is required";
    }

    if (createProductDto.amountAvailable < 0) {
      return "Amount available must be greater than 0";
    }
    if (createProductDto.cost < 0) {
      return "Cost must be greater than 0";
    }

    const productName = createProductDto.productName;
    const product = await this.productRepository.findOneBy({ productName });
    if (product && product.productName) {
      return "Product name already exists";
    }

    return null;
  }

  async validateUpdateProduct(id: number, updateProductDto: UpdateProductDto) {
    if (updateProductDto.productName === "") {
      return "Product name is required";
    }

    if (updateProductDto.amountAvailable < 0) {
      return "Amount available must be greater than 0";
    }

    if (updateProductDto.cost < 0) {
      return "Cost must be greater than 0";
    }
    const oldProduct = await this.productRepository.findOneBy({
      productId: id,
    });

    const productName = updateProductDto.productName;
    const product = await this.productRepository.findOneBy({ productName });

    if (product && oldProduct.productName !== productName) {
      return "Product already exists";
    }

    return null;
  }

  async create(createProductDto: CreateProductDto, userId: number) {
    const message = await this.validateCreateProduct(createProductDto);
    if (message) {
      return {
        message,
        status: false,
      };
    }
    const product = new Product();
    product.productName = createProductDto.productName;
    product.amountAvailable = createProductDto.amountAvailable;
    product.cost = createProductDto.cost;
    product.sellerId = userId;
    const createdProduct = await this.productRepository.save(product);
    return { productId: createdProduct.productId, status: true };
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOneBy({ productId: id });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async findMy(userId: number): Promise<Product[]> {
    return await this.productRepository.find({ where: { sellerId: userId } });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOneBy({ productId: id });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    const message = await this.validateUpdateProduct(id, updateProductDto);
    if (message) {
      return {
        message,
        status: false,
      };
    }
    await this.productRepository.update(id, updateProductDto);
    return { productId: id, status: true };
  }

  async remove(id: number): Promise<void> {
    const product = await this.productRepository.findOneBy({ productId: id });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    await this.productRepository.delete(id);
  }

  async removeByUser(userId: number): Promise<void> {
    await this.productRepository.delete({ sellerId: userId });
  }

  async verifySeller(id: number, userId: number) {
    const product = await this.productRepository.findOneBy({ productId: id });
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    if (product.sellerId === userId) {
      return true;
    }
    return false;
  }
}
