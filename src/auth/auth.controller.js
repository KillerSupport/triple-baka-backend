const {
  Body,
  Controller,
  Dependencies,
  Get,
  HttpCode,
  Post,
  Req,
} = require('@nestjs/common');
const { bindRoutes } = require('../http');
const { AuthService } = require('./auth.service');
const { authenticated } = require('./access');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register(body) {
    return this.authService.register(body);
  }

  login(body, request) {
    return this.authService.login(body, request.ip);
  }

  profile(request) {
    return request.user;
  }
}

Controller('auth')(AuthController);
Dependencies(AuthService)(AuthController);
bindRoutes(AuthController, [
  ['register', Post('register')],
  ['login', Post('login'), HttpCode(200)],
  ['profile', Get('profile'), authenticated()],
]);
Body()(AuthController.prototype, 'register', 0);
Body()(AuthController.prototype, 'login', 0);
Req()(AuthController.prototype, 'login', 1);
Req()(AuthController.prototype, 'profile', 0);

module.exports = { AuthController };
