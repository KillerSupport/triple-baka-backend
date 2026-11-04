const { Controller, Dependencies, Get } = require('@nestjs/common');
const { AppService } = require('./app.service');
const { bindRoutes } = require('./http');

class AppController {
  constructor(appService) {
    this.appService = appService;
  }

  getHello() {
    return this.appService.getHello();
  }
}

Controller()(AppController);
Dependencies(AppService)(AppController);
bindRoutes(AppController, [['getHello', Get()]]);

module.exports = { AppController };
