
const { EntitySchema } = require('typeorm');

const Category = new EntitySchema({
  name: 'Category',
  tableName: 'categories',

  columns: {
    CategoryID: {
      type: 'int',
      primary: true,
      generated: true,
    },

    CategoryName: {
      type: 'varchar',
      length: 100,
      unique: true,
    },

    Description: {
      type: 'text',
      nullable: true,
    },

    CreatedAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});

module.exports = { Category };
