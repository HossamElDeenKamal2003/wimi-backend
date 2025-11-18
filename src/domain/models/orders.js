const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tamaraId:{
    type: String,
    default: null,
  },
  emaknId: {
      type: String,
      default: null
  },
  products: [  // ✅ changed this from productId to products
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      traderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trader',
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],

  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },

  paymentState: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },

  orderDate: {
    type: Date,
    default: Date.now
  }
});

const Orders = mongoose.model('orders', orderSchema);
module.exports = Orders;
