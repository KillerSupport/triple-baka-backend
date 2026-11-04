const {
  Dependencies,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  UseGuards,
} = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { User } = require('../entities/user.entity');

class JwtGuard {
  constructor(jwt, users) {
    this.jwt = jwt;
    this.users = users;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const match = /^Bearer ([^\s]+)$/i.exec(
      request.headers.authorization || '',
    );
    if (!match) throw new UnauthorizedException('Bearer token required');

    let payload;
    try {
      payload = await this.jwt.verifyAsync(match[1], { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (!Number.isSafeInteger(payload.sub) || payload.sub < 1) {
      throw new UnauthorizedException('Invalid token subject');
    }
    const user = await this.users.findOneBy({ UserID: payload.sub });
    if (!user) throw new UnauthorizedException('Account unavailable');
    request.user = user;
    return true;
  }
}

class AdminGuard {
  canActivate(context) {
    if (context.switchToHttp().getRequest().user?.Role !== 'admin') {
      throw new ForbiddenException('Administrator access required');
    }
    return true;
  }
}

Injectable()(JwtGuard);
Dependencies(JwtService, getRepositoryToken(User))(JwtGuard);
Injectable()(AdminGuard);

const authenticated = () => UseGuards(JwtGuard);
const administrator = () => UseGuards(JwtGuard, AdminGuard);

module.exports = { JwtGuard, AdminGuard, authenticated, administrator };
