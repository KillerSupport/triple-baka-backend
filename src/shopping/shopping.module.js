const { Module } = require('@nestjs/common');
const { AuthModule } = require('../auth/auth.module');
const { CartController, OrdersController } = require('./shopping.controllers');
const { CartService } = require('./cart.service');
const { OrdersService } = require('./orders.service');

class ShoppingModule {}

Module({
  imports: [AuthModule],
  controllers: [CartController, OrdersController],
  providers: [CartService, OrdersService],
})(ShoppingModule);

module.exports = { ShoppingModule };
