
const {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} = require('@nestjs/common');

const { InjectRepository } = require('@nestjs/typeorm');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcrypt');

const { User } = require('../entities/user.entity');

class AuthService {
  constructor(userRepository, jwtService) {
    this.userRepository = userRepository;
    this.jwtService = jwtService;
  }

  // REGISTER USER
  async register(data) {
    const { FullName, Email, Password } = data || {};

    if (
      typeof FullName !== 'string' ||
      typeof Email !== 'string' ||
      typeof Password !== 'string' ||
      !FullName.trim() ||
      !Email.trim() ||
      Password.length < 8
    ) {
      throw new BadRequestException(
        'FullName, valid Email, and Password (minimum 8 characters) are required'
      );
    }

    const email = Email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email address');
    }

    const existingUser = await this.userRepository.findOne({
      where: { Email: email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    const user = this.userRepository.create({
      FullName: FullName.trim(),
      Email: email,
      Password: hashedPassword,
      Role: 'customer',
    });

    try {
      const savedUser = await this.userRepository.save(user);

      return {
        message: 'User registered successfully',
        user: {
          UserID: savedUser.UserID,
          FullName: savedUser.FullName,
          Email: savedUser.Email,
          Role: savedUser.Role,
        },
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  // LOGIN USER
  async login(data) {
    const { Email, Password } = data || {};

    if (
      typeof Email !== 'string' ||
      typeof Password !== 'string' ||
      !Email.trim() ||
      !Password
    ) {
      throw new BadRequestException(
        'Email and Password are required'
      );
    }

    const email = Email.trim().toLowerCase();

    const user = await this.userRepository
  .createQueryBuilder('user')
  .addSelect('user.Password')
  .where('user.Email = :email', { email })
  .getOne();

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password'
      );
    }

    const passwordMatch = await bcrypt.compare(
      Password,
      user.Password
    );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Invalid email or password'
      );
    }

    const payload = {
      sub: user.UserID,
      email: user.Email,
      role: user.Role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      access_token: accessToken,
      token_type: 'Bearer',
      user: {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        Role: user.Role,
      },
    };
  }
}

Injectable()(AuthService);

InjectRepository(User)(AuthService, undefined, 0);
Reflect.defineMetadata(
  'design:paramtypes',
  [Object, JwtService],
  AuthService
);

module.exports = { AuthService };
