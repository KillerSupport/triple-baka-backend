
const { EntitySchema } = require('typeorm');

const User = new EntitySchema({
  name: 'User',
  tableName: 'users',

  columns: {
    UserID: {
      type: 'int',
      primary: true,
      generated: true,
    },

    FullName: {
      type: 'varchar',
      length: 100,
    },

    Email: {
      type: 'varchar',
      length: 150,
      unique: true,
    },

    Password: {
      type: 'varchar',
      length: 255,
      select: false,
    },

    Role: {
      type: 'enum',
      enum: ['customer', 'admin'],
      default: 'customer',
    },

    CreatedAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});

module.exports = { User };
