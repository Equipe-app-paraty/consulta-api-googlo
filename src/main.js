// src/main.js
// Ponto de entrada principal

require('dotenv').config();
const { searchByRegion } = require('./services/searchService');
const { enrichPlaces } = require('./services/enrichService');
const { displayPlaceDetails, saveToFile } = require('./utils/displayUtils');

// Main function to run the searches
async function main() {
  console.log('Searching for restaurants and inns in Paraty using regional search...');
  
  // Search for restaurants
  const restaurantResults = await searchByRegion('restaurantes em Paraty', 'restaurant');
  console.log(`\nFound ${restaurantResults.length} total restaurant results in Paraty`);
  
  // Filter only operational places
  const operationalRestaurants = restaurantResults.filter(place => 
    place.business_status === 'OPERATIONAL');
  console.log(`${operationalRestaurants.length} restaurants are operational`);
  
  if (operationalRestaurants.length > 0) {
    // Get detailed information for restaurants
    const enrichedRestaurants = await enrichPlaces(operationalRestaurants);
    
    console.log('\nRestaurants in Paraty with detailed information:');
    console.table(displayPlaceDetails(enrichedRestaurants));
    
    // Save to file
    saveToFile('paraty-restaurants.json', enrichedRestaurants);
  }
  
  // Search for inns (pousadas)
  const innResults = await searchByRegion('pousadas em Paraty', 'lodging');
  console.log(`\nFound ${innResults.length} total inn results in Paraty`);
  
  // Filter only operational places
  const operationalInns = innResults.filter(place => 
    place.business_status === 'OPERATIONAL');
  console.log(`${operationalInns.length} inns are operational`);
  
  if (operationalInns.length > 0) {
    // Get detailed information for inns
    const enrichedInns = await enrichPlaces(operationalInns);
    
    console.log('\nInns in Paraty with detailed information:');
    console.table(displayPlaceDetails(enrichedInns));
    
    // Save to file
    saveToFile('paraty-inns.json', enrichedInns);
  }
}

// Only run the main function if this file is being executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('An error occurred:', error);
  });
}

module.exports = { main };