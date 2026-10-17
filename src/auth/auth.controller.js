
const { Controller, Post, Body } = require('@nestjs/common');
const { AuthService } = require('./auth.service');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  // REGISTER
  async register(data) {
    return this.authService.register(data);
  }

  // LOGIN
  async login(data) {
    return this.authService.login(data);
  }
}

// NestJS decorators
Controller('auth')(AuthController);

// POST /auth/register
Post('register')(
  AuthController.prototype,
  'register',
  Object.getOwnPropertyDescriptor(
    AuthController.prototype,
    'register'
  )
);

Body()(AuthController.prototype, 'register', 0);

// POST /auth/login
Post('login')(
  AuthController.prototype,
  'login',
  Object.getOwnPropertyDescriptor(
    AuthController.prototype,
    'login'
  )
);

Body()(AuthController.prototype, 'login', 0);

// Dependency injection
Reflect.defineMetadata(
  'design:paramtypes',
  [AuthService],
  AuthController
);

module.exports = { AuthController };
