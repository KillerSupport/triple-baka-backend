const { Injectable } = require('@nestjs/common');

class AppService {
  getHello() {
    return 'Hello World!';
  }
}

Injectable()(AppService);
module.exports = { AppService };
