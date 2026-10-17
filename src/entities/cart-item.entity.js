
const { EntitySchema } = require('typeorm');

const CartItem = new EntitySchema({
  name: 'CartItem',
  tableName: 'cartitems',

  columns: {
    CartItemID: {
      type: 'int',
      primary: true,
      generated: true,
    },

    UserID: {
      type: 'int',
    },

    ProductID: {
      type: 'int',
    },

    Quantity: {
      type: 'int',
      default: 1,
    },

    AddedAt: {
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
      onDelete: 'CASCADE',
    },
  },

  uniques: [
    {
      name: 'UQ_cart_user_product',
      columns: ['UserID', 'ProductID'],
    },
  ],
});

module.exports = { CartItem };
