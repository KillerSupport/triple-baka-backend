const { Module } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { AppController } = require('./app.controller');
const { AppService } = require('./app.service');
const { AuthModule } = require('./auth/auth.module');
const { CatalogModule } = require('./catalog/catalog.module');
const { ShoppingModule } = require('./shopping/shopping.module');
const { databaseOptions } = require('./database');

class AppModule {}

Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...databaseOptions(process.env), retryAttempts: 1 }),
    }),
    AuthModule,
    CatalogModule,
    ShoppingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})(AppModule);

module.exports = { AppModule };
