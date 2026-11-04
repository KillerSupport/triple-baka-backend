const { AuthController } = require('./auth.controller');

test('login forwards credentials and the request IP to AuthService', () => {
  const service = { login: jest.fn() };
  const controller = new AuthController(service);
  const data = {
    Email: 'customer@example.test',
    Password: 'test only password',
  };
  controller.login(data, { ip: '127.0.0.1' });
  expect(service.login).toHaveBeenCalledWith(data, '127.0.0.1');
});
