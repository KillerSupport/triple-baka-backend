const { Category } = require('./entities/category.entity');
const { Product } = require('./entities/product.entity');
const { CartItem } = require('./entities/cart-item.entity');
const { Order } = require('./entities/order.entity');
const { OrderItem } = require('./entities/order-item.entity');
const { User } = require('./entities/user.entity');

function databaseOptions(env) {
  return {
    type: 'mysql',
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    username: env.DB_USERNAME || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || 'triple_baka_db',
    charset: 'utf8mb4',
    entities: [User, Category, Product, CartItem, Order, OrderItem],
    synchronize: env.DB_SYNCHRONIZE === 'true',
  };
}

module.exports = { databaseOptions };
