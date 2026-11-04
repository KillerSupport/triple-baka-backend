const { Injectable, Dependencies } = require('@nestjs/common');
const { getRepositoryToken } = require('@nestjs/typeorm');
const { Category } = require('../entities/category.entity');
const { Product } = require('../entities/product.entity');
const {
  input,
  integer,
  text,
  findOrFail,
  translateConstraint,
} = require('../http');

const description = {
  check: (value) =>
    value === null || (typeof value === 'string' && value.length <= 5000),
  optional: true,
  message: 'must be null or a string of at most 5000 characters',
};
const categoryFields = { CategoryName: text(100), Description: description };
const productFields = {
  ProductName: text(150),
  Description: description,
  Price: {
    check: (value) =>
      ['string', 'number'].includes(typeof value) &&
      /^\d{1,8}(\.\d{1,2})?$/.test(String(value)),
    message: 'must be a nonnegative amount with up to two decimal places',
  },
  StockQuantity: integer(0),
  CategoryID: integer(1),
};

class CatalogService {
  constructor(categories, products) {
    this.categories = categories;
    this.products = products;
  }

  listCategories() {
    return this.categories.find({ order: { CategoryID: 'ASC' } });
  }

  category(CategoryID) {
    return findOrFail(this.categories, { CategoryID }, 'Category');
  }

  async createCategory(body) {
    const fields = input(body, categoryFields);
    return this.categories
      .save(this.categories.create(fields))
      .catch(translateConstraint);
  }

  async updateCategory(CategoryID, body) {
    const fields = input(body, categoryFields, true);
    await this.category(CategoryID);
    await this.categories
      .update({ CategoryID }, fields)
      .catch(translateConstraint);
    return this.category(CategoryID);
  }

  async deleteCategory(CategoryID) {
    await this.category(CategoryID);
    await this.categories.delete({ CategoryID }).catch(translateConstraint);
  }

  async listCategoryProducts(CategoryID) {
    await this.category(CategoryID);
    return this.products.find({
      where: { CategoryID },
      order: { ProductID: 'ASC' },
    });
  }

  listProducts() {
    return this.products.find({ order: { ProductID: 'ASC' } });
  }

  product(ProductID) {
    return findOrFail(this.products, { ProductID }, 'Product');
  }

  async createProduct(body) {
    const fields = input(body, productFields);
    await this.category(fields.CategoryID);
    const product = await this.products
      .save(this.products.create(fields))
      .catch(translateConstraint);
    return this.product(product.ProductID);
  }

  async updateProduct(ProductID, body) {
    const fields = input(body, productFields, true);
    await this.product(ProductID);
    if (fields.CategoryID !== undefined) await this.category(fields.CategoryID);
    await this.products
      .update({ ProductID }, fields)
      .catch(translateConstraint);
    return this.product(ProductID);
  }

  async deleteProduct(ProductID) {
    await this.product(ProductID);
    await this.products.delete({ ProductID }).catch(translateConstraint);
  }
}

Injectable()(CatalogService);
Dependencies(
  getRepositoryToken(Category),
  getRepositoryToken(Product),
)(CatalogService);

module.exports = { CatalogService };
