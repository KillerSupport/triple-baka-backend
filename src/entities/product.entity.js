
const { EntitySchema } = require('typeorm');

const Product = new EntitySchema({
  name: 'Product',
  tableName: 'products',

  columns: {
    ProductID: {
      type: 'int',
      primary: true,
      generated: true,
    },

    ProductName: {
      type: 'varchar',
      length: 150,
    },

    Description: {
      type: 'text',
      nullable: true,
    },

    Price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
    },

    StockQuantity: {
      type: 'int',
      default: 0,
    },

    CategoryID: {
      type: 'int',
    },

    CreatedAt: {
      type: 'timestamp',
      createDate: true,
    },
  },

  relations: {
    category: {
      type: 'many-to-one',
      target: 'Category',
      joinColumn: {
        name: 'CategoryID',
        referencedColumnName: 'CategoryID',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
  },
});

module.exports = { Product };
