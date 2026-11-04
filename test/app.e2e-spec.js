const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { Test } = require('@nestjs/testing');
const { DataSource } = require('typeorm');
const request = require('supertest');
const { databaseOptions } = require('../src/database');
const { User } = require('../src/entities/user.entity');

jest.setTimeout(30000);

describe('Triple Baka API with XAMPP MySQL', () => {
  const database = 'triple_baka_test_' + randomUUID().replaceAll('-', '');
  const Password = randomUUID();
  const previous = Object.fromEntries(
    ['DB_DATABASE', 'DB_SYNCHRONIZE', 'JWT_SECRET'].map((key) => [
      key,
      process.env[key],
    ]),
  );
  let serverConnection;
  let app;
  let api;
  let customerToken;
  let otherToken;
  let adminToken;

  beforeAll(async () => {
    process.loadEnvFile();
    const options = databaseOptions(process.env);
    serverConnection = await mysql.createConnection({
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
    });
    await serverConnection.query('CREATE DATABASE ?? CHARACTER SET utf8mb4', [
      database,
    ]);
    Object.assign(process.env, {
      DB_DATABASE: database,
      DB_SYNCHRONIZE: 'true',
      JWT_SECRET: randomUUID(),
    });

    const { AppModule } = require('../src/app.module');
    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = fixture.createNestApplication({ logger: false });
    await app.init();
    api = request(app.getHttpServer());
  });

  afterAll(async () => {
    try {
      if (app) await app.close();
      if (serverConnection)
        await serverConnection.query('DROP DATABASE IF EXISTS ??', [database]);
    } finally {
      if (serverConnection) await serverConnection.end();
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  async function createUser(name, role = 'customer') {
    const Email = name + '@example.test';
    const registered = await api
      .post('/auth/register')
      .send({
        FullName: name,
        Email,
        Password,
        Role: 'admin',
      })
      .expect(201);
    expect(registered.body.user.Role).toBe('customer');
    expect(registered.body.user.Password).toBeUndefined();

    if (role === 'admin') {
      const users = app.get(DataSource).getRepository(User);
      await users.update({ Email }, { Role: role });
      const stored = await users
        .createQueryBuilder('user')
        .addSelect('user.Password')
        .where({ Email })
        .getOne();
      expect(stored.Password).not.toEqual(Password);
      expect(await bcrypt.compare(Password, stored.Password)).toBe(true);
    }
    const login = await api
      .post('/auth/login')
      .send({ Email, Password })
      .expect(200);
    expect(login.body.user.Role).toBe(role);
    return login.body.access_token;
  }

  const authorize = (httpRequest, token) =>
    httpRequest.set('Authorization', 'Bearer ' + token);

  beforeAll(async () => {
    customerToken = await createUser('first');
    otherToken = await createUser('second');
    adminToken = await createUser('administrator', 'admin');
  });

  test('auth verifies tokens, passwords and roles', async () => {
    await api.get('/').expect(200, 'Hello World!');
    await api.get('/auth/profile').expect(401);
    await authorize(api.get('/auth/profile'), 'invalid').expect(401);
    const profile = await authorize(
      api.get('/auth/profile'),
      customerToken,
    ).expect(200);
    expect(profile.body).toMatchObject({
      Email: 'first@example.test',
      Role: 'customer',
    });
    expect(profile.body.Password).toBeUndefined();

    await api
      .post('/auth/login')
      .send({ Email: 'first@example.test', Password: randomUUID() })
      .expect(401);
    await api
      .post('/auth/register')
      .send({ FullName: 'First', Email: 'first@example.test', Password })
      .expect(409);
    await api
      .post('/auth/register')
      .send({ FullName: 'Invalid', Email: 'bad', Password })
      .expect(400);
    await authorize(api.post('/categories'), customerToken)
      .send({ CategoryName: 'Forbidden' })
      .expect(403);
    await authorize(api.get('/orders/all'), customerToken).expect(403);
  });

  test('catalog supports category and product CRUD and maintains relationships', async () => {
    const category = (
      await authorize(api.post('/categories'), adminToken)
        .send({ CategoryName: 'Figures' })
        .expect(201)
    ).body;
    const categoryUrl = '/categories/' + category.CategoryID;
    await api.get('/categories').expect(200);
    await api.get(categoryUrl).expect(200);
    await authorize(api.patch(categoryUrl), adminToken)
      .send({ Description: 'Collectible figures' })
      .expect(200);

    const fields = {
      CategoryID: category.CategoryID,
      ProductName: 'Figure',
      Price: '125.50',
      StockQuantity: 4,
    };
    await authorize(api.post('/products'), adminToken)
      .send({ ...fields, Price: -1 })
      .expect(400);
    const product = (
      await authorize(api.post('/products'), adminToken)
        .send(fields)
        .expect(201)
    ).body;
    const productUrl = '/products/' + product.ProductID;
    await api.get('/products').expect(200);
    await api.get(productUrl).expect(200);
    const products = await api.get(categoryUrl + '/products').expect(200);
    expect(products.body).toHaveLength(1);
    await authorize(api.patch(productUrl), adminToken)
      .send({ StockQuantity: 3 })
      .expect(200);
    await authorize(api.delete(categoryUrl), adminToken).expect(409);
    await authorize(api.delete(productUrl), adminToken).expect(204);
    await api.get(productUrl).expect(404);
    await authorize(api.delete(categoryUrl), adminToken).expect(204);
    await api.get(categoryUrl).expect(404);
    await api.get('/products/0').expect(400);
  });

  test('cart ownership, concurrent checkout and cancellation preserve stock', async () => {
    const category = (
      await authorize(api.post('/categories'), adminToken)
        .send({ CategoryName: 'Stands' })
        .expect(201)
    ).body;
    const product = (
      await authorize(api.post('/products'), adminToken)
        .send({
          CategoryID: category.CategoryID,
          ProductName: 'Acrylic Stand',
          Price: '99.95',
          StockQuantity: 3,
        })
        .expect(201)
    ).body;
    const { ProductID } = product;
    const productUrl = '/products/' + ProductID;
    const stock = async () =>
      (await api.get(productUrl).expect(200)).body.StockQuantity;
    const add = (token, Quantity) =>
      authorize(api.post('/cart'), token).send({ ProductID, Quantity });
    const checkout = (token) =>
      authorize(api.post('/orders'), token).send({
        ShippingAddress: 'Test address',
      });

    await api.get('/cart').expect(401);
    const cartItem = (await add(customerToken, 1).expect(200)).body;
    const itemUrl = '/cart/' + cartItem.CartItemID;
    await authorize(api.get('/cart'), customerToken).expect(200);
    await authorize(api.get(itemUrl), customerToken).expect(200);
    await authorize(api.get(itemUrl), otherToken).expect(404);
    await authorize(api.patch(itemUrl), otherToken)
      .send({ Quantity: 1 })
      .expect(404);
    await authorize(api.patch(itemUrl), customerToken)
      .send({ Quantity: 0 })
      .expect(400);
    await authorize(api.patch(itemUrl), customerToken)
      .send({ Quantity: 2 })
      .expect(200);
    await authorize(api.delete(itemUrl), otherToken).expect(404);
    await authorize(api.delete(itemUrl), customerToken).expect(204);
    await checkout(customerToken).expect(409);

    await add(customerToken, 2).expect(200);
    await add(otherToken, 2).expect(200);
    const results = await Promise.all([
      checkout(customerToken),
      checkout(otherToken),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    const winner = results[0].status === 201 ? 0 : 1;
    const [owner, outsider] =
      winner === 0 ? [customerToken, otherToken] : [otherToken, customerToken];
    const order = results[winner].body;
    const orderUrl = '/orders/' + order.OrderID;
    expect(Number(order.TotalAmount)).toBe(199.9);
    expect(await stock()).toBe(1);
    await authorize(api.get('/orders'), owner).expect(200);
    await authorize(api.get('/orders/all'), adminToken).expect(200);
    const detail = await authorize(api.get(orderUrl), owner).expect(200);
    expect(detail.body.items[0]).toMatchObject({ Quantity: 2, ProductID });
    await authorize(api.get(orderUrl), outsider).expect(404);

    await authorize(api.post(orderUrl + '/cancel'), owner).expect(200);
    await authorize(api.post(orderUrl + '/cancel'), owner).expect(200);
    expect(await stock()).toBe(3);

    const next = (await checkout(outsider).expect(201)).body;
    const statusUrl = '/orders/' + next.OrderID + '/status';
    await authorize(api.patch(statusUrl), outsider)
      .send({ OrderStatus: 'processing' })
      .expect(403);
    await authorize(api.patch(statusUrl), adminToken)
      .send({ OrderStatus: 'shipped' })
      .expect(409);
    for (const OrderStatus of ['processing', 'shipped', 'delivered']) {
      await authorize(api.patch(statusUrl), adminToken)
        .send({ OrderStatus })
        .expect(200);
    }
    await authorize(api.patch(statusUrl), adminToken)
      .send({ OrderStatus: 'cancelled' })
      .expect(409);
    await authorize(api.delete(productUrl), adminToken).expect(409);
  });
});
