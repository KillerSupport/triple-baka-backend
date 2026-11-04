const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { AuthModule } = require('../auth/auth.module');
const { Category } = require('../entities/category.entity');
const { Product } = require('../entities/product.entity');
const { CatalogService } = require('./catalog.service');
const {
  CategoriesController,
  ProductsController,
} = require('./catalog.controllers');

class CatalogModule {}

Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Category, Product])],
  controllers: [CategoriesController, ProductsController],
  providers: [CatalogService],
})(CatalogModule);

module.exports = { CatalogModule };
