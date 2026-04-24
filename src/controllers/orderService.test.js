const { createOrderWithTransaction } = require('./orderController');
const Order = require('../models/Order.model');
const FoodPartner = require('../models/FoodPartner.model');
const mongoose = require('mongoose');

/**
 * Test function to demonstrate the order placement transaction
 * This would typically be in a separate test file, but included here for demonstration
 */
const testOrderTransaction = async () => {
  try {
    console.log('Testing order placement transaction...');
    
    // Sample order data
    const sampleOrderData = {
      user: new mongoose.Types.ObjectId(), // Would normally be a real user ID
      orderId: `TEST${Date.now()}`,
      restaurant: {
        name: 'Test Restaurant',
        address: '123 Test Street',
        restaurantId: new mongoose.Types.ObjectId() // Would normally be a real FoodPartner ID
      },
      items: [
        {
          name: 'Test Item 1',
          quantity: 2,
          price: 15.99,
          image: 'test1.jpg'
        },
        {
          name: 'Test Item 2',
          quantity: 1,
          price: 8.50,
          image: 'test2.jpg'
        }
      ],
      totalAmount: 40.48,
      deliveryAddress: '456 Delivery Address',
      status: 'Confirmed',
      paymentMethod: 'COD'
    };
    
    // Execute the transaction
    const result = await createOrderWithTransaction(sampleOrderData);
    
    if (result.success) {
      console.log('✅ Transaction successful!');
      console.log('Order created:', result.order.orderId);
      console.log('Partner income updated:', result.partner.totalIncome);
    } else {
      console.log('❌ Transaction failed:', result.message);
      console.log('Error:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Test error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test transaction rollback scenario
 */
const testTransactionRollback = async () => {
  try {
    console.log('\nTesting transaction rollback with invalid FoodPartner ID...');
    
    // Sample order data with invalid restaurantId
    const invalidOrderData = {
      user: new mongoose.Types.ObjectId(),
      orderId: `FAIL${Date.now()}`,
      restaurant: {
        name: 'Test Restaurant',
        address: '123 Test Street',
        restaurantId: new mongoose.Types.ObjectId() // Invalid/non-existent ID
      },
      items: [
        {
          name: 'Test Item',
          quantity: 1,
          price: 10.00,
          image: 'test.jpg'
        }
      ],
      totalAmount: 10.00,
      deliveryAddress: '456 Delivery Address',
      status: 'Confirmed',
      paymentMethod: 'COD'
    };
    
    // This should fail and rollback
    const result = await createOrderWithTransaction(invalidOrderData);
    
    if (!result.success) {
      console.log('✅ Transaction correctly rolled back!');
      console.log('Rollback message:', result.message);
    } else {
      console.log('❌ Unexpected success - rollback failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('Rollback test error:', error);
    return { success: false, error: error.message };
  }
};

// Export test functions
module.exports = {
  testOrderTransaction,
  testTransactionRollback
};

// Uncomment to run tests directly (only for development)
// if (require.main === module) {
//   mongoose.connect('mongodb+srv://garvgupta6778_db_user:DZKvs8tBoCXQXsT1@cluster0.jtkxzmk.mongodb.net/foodie-test')
//     .then(async () => {
//       await testOrderTransaction();
//       await testTransactionRollback();
//       process.exit(0);
//     })
//     .catch(err => {
//       console.error('Database connection failed:', err);
//       process.exit(1);
//     });
// }
