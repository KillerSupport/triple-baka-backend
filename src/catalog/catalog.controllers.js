const {
  Body,
  Controller,
  Delete,
  Dependencies,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} = require('@nestjs/common');
const { bindRoutes, id } = require('../http');
const { administrator } = require('../auth/access');
const { CatalogService } = require('./catalog.service');

class CategoriesController {
  constructor(catalog) {
    this.catalog = catalog;
  }

  list() {
    return this.catalog.listCategories();
  }
  detail(rawId) {
    return this.catalog.category(id(rawId));
  }
  create(body) {
    return this.catalog.createCategory(body);
  }
  update(rawId, body) {
    return this.catalog.updateCategory(id(rawId), body);
  }
  remove(rawId) {
    return this.catalog.deleteCategory(id(rawId));
  }
  products(rawId) {
    return this.catalog.listCategoryProducts(id(rawId));
  }
}

Controller('categories')(CategoriesController);
Dependencies(CatalogService)(CategoriesController);
bindRoutes(CategoriesController, [
  ['list', Get()],
  ['detail', Get(':id')],
  ['create', Post(), administrator()],
  ['update', Patch(':id'), administrator()],
  ['remove', Delete(':id'), HttpCode(204), administrator()],
  ['products', Get(':id/products')],
]);
Param('id')(CategoriesController.prototype, 'detail', 0);
Body()(CategoriesController.prototype, 'create', 0);
Param('id')(CategoriesController.prototype, 'update', 0);
Body()(CategoriesController.prototype, 'update', 1);
Param('id')(CategoriesController.prototype, 'remove', 0);
Param('id')(CategoriesController.prototype, 'products', 0);

class ProductsController {
  constructor(catalog) {
    this.catalog = catalog;
  }

  list() {
    return this.catalog.listProducts();
  }
  detail(rawId) {
    return this.catalog.product(id(rawId));
  }
  create(body) {
    return this.catalog.createProduct(body);
  }
  update(rawId, body) {
    return this.catalog.updateProduct(id(rawId), body);
  }
  remove(rawId) {
    return this.catalog.deleteProduct(id(rawId));
  }
}

Controller('products')(ProductsController);
Dependencies(CatalogService)(ProductsController);
bindRoutes(ProductsController, [
  ['list', Get()],
  ['detail', Get(':id')],
  ['create', Post(), administrator()],
  ['update', Patch(':id'), administrator()],
  ['remove', Delete(':id'), HttpCode(204), administrator()],
]);
Param('id')(ProductsController.prototype, 'detail', 0);
Body()(ProductsController.prototype, 'create', 0);
Param('id')(ProductsController.prototype, 'update', 0);
Body()(ProductsController.prototype, 'update', 1);
Param('id')(ProductsController.prototype, 'remove', 0);

module.exports = { CategoriesController, ProductsController };
