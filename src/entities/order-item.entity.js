
const { EntitySchema } = require('typeorm');

const OrderItem = new EntitySchema({
  name: 'OrderItem',
  tableName: 'orderitems',

  columns: {
    OrderItemID: {
      type: 'int',
      primary: true,
      generated: true,
    },

    OrderID: {
      type: 'int',
    },

    ProductID: {
      type: 'int',
    },

    Quantity: {
      type: 'int',
    },

    Price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
    },
  },

  relations: {
    order: {
      type: 'many-to-one',
      target: 'Order',
      joinColumn: {
        name: 'OrderID',
        referencedColumnName: 'OrderID',
      },
      nullable: false,
      onDelete: 'CASCADE',
    },

    product: {
      type: 'many-to-one',
      target: 'Product',
      joinColumn: {
        name: 'ProductID',
        referencedColumnName: 'ProductID',
      },
      nullable: false,
      onDelete: 'RESTRICT',
    },
  },
});

module.exports = { OrderItem };
