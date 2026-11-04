const {
  Body,
  Controller,
  Delete,
  Dependencies,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
} = require('@nestjs/common');
const { authenticated, administrator } = require('../auth/access');
const { bindRoutes, id } = require('../http');
const { CartService } = require('./cart.service');
const { OrdersService } = require('./orders.service');

class CartController {
  constructor(cart) {
    this.cart = cart;
  }

  list(request) {
    return this.cart.list(request.user.UserID);
  }
  detail(request, rawId) {
    return this.cart.detail(request.user.UserID, id(rawId));
  }
  add(request, body) {
    return this.cart.add(request.user.UserID, body);
  }
  update(request, rawId, body) {
    return this.cart.update(request.user.UserID, id(rawId), body);
  }
  remove(request, rawId) {
    return this.cart.remove(request.user.UserID, id(rawId));
  }
}

Controller('cart')(CartController);
authenticated()(CartController);
Dependencies(CartService)(CartController);
bindRoutes(CartController, [
  ['list', Get()],
  ['detail', Get(':id')],
  ['add', Post(), HttpCode(200)],
  ['update', Patch(':id')],
  ['remove', Delete(':id'), HttpCode(204)],
]);
for (const method of ['list', 'detail', 'add', 'update', 'remove'])
  Req()(CartController.prototype, method, 0);
for (const method of ['detail', 'update', 'remove'])
  Param('id')(CartController.prototype, method, 1);
Body()(CartController.prototype, 'add', 1);
Body()(CartController.prototype, 'update', 2);

class OrdersController {
  constructor(orders) {
    this.orders = orders;
  }

  list(request) {
    return this.orders.list({ UserID: request.user.UserID });
  }
  all() {
    return this.orders.list();
  }
  detail(request, rawId) {
    return this.orders.detail(id(rawId), request.user);
  }
  checkout(request, body) {
    return this.orders.checkout(request.user.UserID, body);
  }
  status(rawId, body) {
    return this.orders.updateStatus(id(rawId), body);
  }
  cancel(request, rawId) {
    return this.orders.cancel(id(rawId), request.user.UserID);
  }
}

Controller('orders')(OrdersController);
Dependencies(OrdersService)(OrdersController);
bindRoutes(OrdersController, [
  ['list', Get(), authenticated()],
  ['all', Get('all'), administrator()],
  ['detail', Get(':id'), authenticated()],
  ['checkout', Post(), authenticated()],
  ['status', Patch(':id/status'), administrator()],
  ['cancel', Post(':id/cancel'), HttpCode(200), authenticated()],
]);
for (const method of ['list', 'detail', 'checkout', 'cancel'])
  Req()(OrdersController.prototype, method, 0);
for (const method of ['detail', 'cancel'])
  Param('id')(OrdersController.prototype, method, 1);
Body()(OrdersController.prototype, 'checkout', 1);
Param('id')(OrdersController.prototype, 'status', 0);
Body()(OrdersController.prototype, 'status', 1);

module.exports = { CartController, OrdersController };
