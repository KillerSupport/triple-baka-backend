
const { EntitySchema } = require('typeorm');

const Order = new EntitySchema({
  name: 'Order',
  tableName: 'orders',

  columns: {
    OrderID: {
      type: 'int',
      primary: true,
      generated: true,
    },

    UserID: {
      type: 'int',
    },

    TotalAmount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },

    OrderStatus: {
      type: 'enum',
      enum: [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },

    ShippingAddress: {
      type: 'text',
    },

    OrderDate: {
      type: 'timestamp',
      createDate: true,
    },
  },

  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'UserID',
        referencedColumnName: 'UserID',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
  },
});

module.exports = { Order };
