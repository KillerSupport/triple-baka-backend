const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { JwtModule } = require('@nestjs/jwt');
const { ConfigService } = require('@nestjs/config');
const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');
const { AdminGuard, JwtGuard } = require('./access');
const { User } = require('../entities/user.entity');

class AuthModule {}

Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, AdminGuard],
  exports: [JwtModule, TypeOrmModule, JwtGuard, AdminGuard],
})(AuthModule);

module.exports = { AuthModule };
