const mongoose = require('mongoose');
const FoodPartnerModel = require('../src/models/FoodPartner.model.js');

// Sample ratings for restaurants
const sampleRatings = [
  4.5, 4.2, 3.8, 4.7, 4.1, 3.9, 4.6, 4.3, 4.8, 4.0,
  3.7, 4.4, 4.9, 3.6, 4.5, 4.2, 3.8, 4.7, 4.1, 3.9
];

async function updateRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://garvgupta6778_db_user:DZKvs8tBoCXQXsT1@cluster0.jtkxzmk.mongodb.net/foodie');
    console.log('Connected to MongoDB');

    // Get all restaurants
    const restaurants = await FoodPartnerModel.find({});
    console.log(`Found ${restaurants.length} restaurants`);

    // Update each restaurant with a random decimal rating
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      const randomRating = sampleRatings[i % sampleRatings.length];
      
      await FoodPartnerModel.findByIdAndUpdate(
        restaurant._id,
        { rating: randomRating }
      );
      
      console.log(`Updated ${restaurant.restaurantName}: rating = ${randomRating}`);
    }

    console.log('All ratings updated successfully!');
    
    // Show updated values
    const updatedRestaurants = await FoodPartnerModel.find({}).select('restaurantName rating');
    console.log('\nUpdated ratings:');
    updatedRestaurants.forEach(rest => {
      console.log(`${rest.restaurantName}: ${rest.rating} (type: ${typeof rest.rating})`);
    });

  } catch (error) {
    console.error('Error updating ratings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

updateRatings();
