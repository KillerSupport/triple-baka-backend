const {
  Dependencies,
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
  UnauthorizedException,
} = require('@nestjs/common');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcrypt');
const { User } = require('../entities/user.entity');

const LOGIN_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 20;

function publicUser({ UserID, FullName, Email, Role }) {
  return { UserID, FullName, Email, Role };
}

function credentials(data) {
  const { Email, Password } = data || {};
  const email = typeof Email === 'string' ? Email.trim().toLowerCase() : '';
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('A valid email address is required');
  }
  if (typeof Password !== 'string' || !Password) {
    throw new BadRequestException('Password is required');
  }
  return { email, Password };
}

class AuthService {
  constructor(users, jwt) {
    this.users = users;
    this.jwt = jwt;
    this.attempts = new Map();
  }

  async register(data) {
    const { email, Password } = credentials(data);
    const fullName =
      typeof data.FullName === 'string' ? data.FullName.trim() : '';
    if (
      !fullName ||
      fullName.length > 100 ||
      Password.length < 8 ||
      Buffer.byteLength(Password) > 72
    ) {
      throw new BadRequestException(
        'FullName (1 to 100 characters) and a password of at least 8 characters and at most 72 UTF-8 bytes are required',
      );
    }

    if (await this.users.findOneBy({ Email: email })) {
      throw new ConflictException('Email already registered');
    }
    const user = this.users.create({
      FullName: fullName,
      Email: email,
      Password: await bcrypt.hash(Password, 10),
      Role: 'customer',
    });

    try {
      const saved = await this.users.save(user);
      return {
        message: 'User registered successfully',
        user: publicUser(saved),
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY')
        throw new ConflictException('Email already registered');
      throw error;
    }
  }

  checkLoginLimit(ip) {
    const now = Date.now();
    for (const [key, attempt] of this.attempts) {
      if (attempt.expires <= now) this.attempts.delete(key);
      else break;
    }
    const attempt = this.attempts.get(ip) || {
      count: 0,
      expires: now + LOGIN_WINDOW_MS,
    };
    if (attempt.count >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts. Try again in a minute.',
        429,
      );
    }
    if (!this.attempts.has(ip) && this.attempts.size >= 10000) {
      throw new HttpException(
        'Too many login attempts. Try again in a minute.',
        429,
      );
    }
    attempt.count++;
    this.attempts.set(ip, attempt);
  }

  async login(data, ip) {
    this.checkLoginLimit(ip);
    const { email, Password } = credentials(data);
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.Password')
      .where('user.Email = :email', { email })
      .getOne();

    if (!user || !(await bcrypt.compare(Password, user.Password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.UserID,
      email: user.Email,
      role: user.Role,
    });
    return {
      message: 'Login successful',
      access_token: accessToken,
      token_type: 'Bearer',
      user: publicUser(user),
    };
  }
}

Injectable()(AuthService);
Dependencies(getRepositoryToken(User), JwtService)(AuthService);

module.exports = { AuthService };
