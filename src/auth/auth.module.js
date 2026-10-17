
const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { JwtModule } = require('@nestjs/jwt');

const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');
const { User } = require('../entities/user.entity');

class AuthModule {}

Module({
  imports: [
    TypeOrmModule.forFeature([User]),

    JwtModule.registerAsync({
      useFactory: () => {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is missing in .env');
        }

        return {
          secret: process.env.JWT_SECRET,
          signOptions: {
            expiresIn: '1h',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})(AuthModule);

module.exports = { AuthModule };
