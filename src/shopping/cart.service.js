const {
  ConflictException,
  Dependencies,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { DataSource } = require('typeorm');
const { CartItem } = require('../entities/cart-item.entity');
const { Product } = require('../entities/product.entity');
const { User } = require('../entities/user.entity');
const { findOrFail, input, integer } = require('../http');

class CartService {
  constructor(database) {
    this.database = database;
  }

  list(UserID) {
    return this.database.getRepository(CartItem).find({
      where: { UserID },
      relations: { product: true },
      order: { CartItemID: 'ASC' },
    });
  }

  detail(UserID, CartItemID) {
    return findOrFail(
      this.database.getRepository(CartItem),
      { UserID, CartItemID },
      'Cart item',
    );
  }

  async add(UserID, body) {
    const { ProductID, Quantity } = input(body, {
      ProductID: integer(1),
      Quantity: integer(1),
    });
    return this.database.transaction(async (manager) => {
      await manager.findOne(User, {
        where: { UserID },
        lock: { mode: 'pessimistic_write' },
      });
      const product = await manager.findOne(Product, {
        where: { ProductID },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Product not found');
      const item = await manager.findOneBy(CartItem, { UserID, ProductID });
      const quantity = (item?.Quantity || 0) + Quantity;
      if (quantity > product.StockQuantity)
        throw new ConflictException('Quantity exceeds available stock');
      return manager.save(CartItem, {
        ...(item || { UserID, ProductID }),
        Quantity: quantity,
      });
    });
  }

  async update(UserID, CartItemID, body) {
    const { Quantity } = input(body, { Quantity: integer(1) });
    return this.database.transaction(async (manager) => {
      await manager.findOne(User, {
        where: { UserID },
        lock: { mode: 'pessimistic_write' },
      });
      const item = await findOrFail(
        manager.getRepository(CartItem),
        { UserID, CartItemID },
        'Cart item',
      );
      const product = await manager.findOne(Product, {
        where: { ProductID: item.ProductID },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Product not found');
      if (Quantity > product.StockQuantity)
        throw new ConflictException('Quantity exceeds available stock');
      await manager.update(CartItem, { UserID, CartItemID }, { Quantity });
      return findOrFail(
        manager.getRepository(CartItem),
        { UserID, CartItemID },
        'Cart item',
      );
    });
  }

  async remove(UserID, CartItemID) {
    await this.database.transaction(async (manager) => {
      await manager.findOne(User, {
        where: { UserID },
        lock: { mode: 'pessimistic_write' },
      });
      await findOrFail(
        manager.getRepository(CartItem),
        { UserID, CartItemID },
        'Cart item',
      );
      await manager.delete(CartItem, { UserID, CartItemID });
    });
  }
}

Injectable()(CartService);
Dependencies(DataSource)(CartService);
module.exports = { CartService };
