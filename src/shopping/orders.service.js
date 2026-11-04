const {
  ConflictException,
  Dependencies,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const { DataSource, In } = require('typeorm');
const { CartItem } = require('../entities/cart-item.entity');
const { Order } = require('../entities/order.entity');
const { OrderItem } = require('../entities/order-item.entity');
const { Product } = require('../entities/product.entity');
const { User } = require('../entities/user.entity');
const { input, text, findOrFail } = require('../http');

const nextStatus = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};
const statusField = {
  check: (value) =>
    ['processing', 'shipped', 'delivered', 'cancelled'].includes(value),
  message: 'must be processing, shipped, delivered, or cancelled',
};

class OrdersService {
  constructor(database) {
    this.database = database;
  }

  list(where) {
    return this.database
      .getRepository(Order)
      .find({ where, order: { OrderID: 'DESC' } });
  }

  async detail(OrderID, user) {
    const where =
      user.Role === 'admin' ? { OrderID } : { OrderID, UserID: user.UserID };
    const order = await findOrFail(
      this.database.getRepository(Order),
      where,
      'Order',
    );
    const items = await this.database.getRepository(OrderItem).find({
      where: { OrderID },
      order: { OrderItemID: 'ASC' },
    });
    return { ...order, items };
  }

  async checkout(UserID, body) {
    const { ShippingAddress } = input(body, { ShippingAddress: text(1000) });
    return this.database.transaction(async (manager) => {
      // Serialize all cart mutations for this account, including double checkout.
      await manager.findOne(User, {
        where: { UserID },
        lock: { mode: 'pessimistic_write' },
      });
      const cart = await manager.find(CartItem, {
        where: { UserID },
        order: { ProductID: 'ASC' },
      });
      if (!cart.length) throw new ConflictException('Cart is empty');

      const products = await manager
        .createQueryBuilder(Product, 'product')
        .where({ ProductID: In(cart.map((item) => item.ProductID)) })
        .orderBy('product.ProductID', 'ASC')
        .setLock('pessimistic_write')
        .getMany();
      const productsById = new Map(
        products.map((product) => [product.ProductID, product]),
      );

      let cents = 0;
      for (const item of cart) {
        const product = productsById.get(item.ProductID);
        if (!product || product.StockQuantity < item.Quantity) {
          throw new ConflictException(
            'Insufficient stock for product ' + item.ProductID,
          );
        }
        cents += Math.round(Number(product.Price) * 100) * item.Quantity;
      }
      if (!Number.isSafeInteger(cents) || cents > 9999999999) {
        throw new ConflictException('Order total exceeds the supported amount');
      }

      const order = await manager.save(Order, {
        UserID,
        ShippingAddress,
        TotalAmount: (cents / 100).toFixed(2),
        OrderStatus: 'pending',
      });
      const items = [];
      for (const { ProductID, Quantity } of cart) {
        const product = productsById.get(ProductID);
        items.push(
          await manager.save(OrderItem, {
            OrderID: order.OrderID,
            ProductID,
            Quantity,
            Price: product.Price,
          }),
        );
        await manager.decrement(
          Product,
          { ProductID },
          'StockQuantity',
          Quantity,
        );
      }
      await manager.delete(CartItem, { UserID });
      return { ...order, items };
    });
  }

  cancel(OrderID, UserID) {
    return this.transition({ OrderID, UserID }, 'cancelled');
  }

  updateStatus(OrderID, body) {
    const { OrderStatus } = input(body, { OrderStatus: statusField });
    return this.transition({ OrderID }, OrderStatus);
  }

  transition(where, status) {
    return this.database.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where,
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.OrderStatus === status) return order;

      if (status === 'cancelled') {
        const cancellable =
          where.UserID === undefined ? ['pending', 'processing'] : ['pending'];
        if (!cancellable.includes(order.OrderStatus)) {
          throw new ConflictException(
            'Order cannot be cancelled in its current state',
          );
        }
        const items = await manager.find(OrderItem, {
          where: { OrderID: order.OrderID },
          order: { ProductID: 'ASC' },
        });
        for (const { ProductID, Quantity } of items) {
          const result = await manager
            .createQueryBuilder()
            .update(Product)
            .set({ StockQuantity: () => 'StockQuantity + :quantity' })
            .where({ ProductID })
            .andWhere('StockQuantity <= :maximum', {
              maximum: 2147483647 - Quantity,
            })
            .setParameter('quantity', Quantity)
            .execute();
          if (!result.affected)
            throw new ConflictException(
              'Restoring stock would exceed the supported quantity',
            );
        }
      } else if (nextStatus[order.OrderStatus] !== status) {
        throw new ConflictException(
          'Order cannot move to the requested status',
        );
      }

      await manager.update(
        Order,
        { OrderID: order.OrderID },
        { OrderStatus: status },
      );
      return { ...order, OrderStatus: status };
    });
  }
}

Injectable()(OrdersService);
Dependencies(DataSource)(OrdersService);
module.exports = { OrdersService };
