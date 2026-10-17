
const { Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { TypeOrmModule } = require('@nestjs/typeorm');

const { AppController } = require('./app.controller');
const { AppService } = require('./app.service');

const { User } = require('./entities/user.entity');
const { Category } = require('./entities/category.entity');
const { Product } = require('./entities/product.entity');
const { CartItem } = require('./entities/cart-item.entity');
const { Order } = require('./entities/order.entity');
const { OrderItem } = require('./entities/order-item.entity');

class AppModule {}

Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,

      entities: [
        User,
        Category,
        Product,
        CartItem,
        Order,
        OrderItem,
      ],

      synchronize: true,
    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})(AppModule);

module.exports = { AppModule };
