require('dotenv').config();
const axios = require('axios');

// Get API key from environment variables
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
console.log('API Key loaded:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

// Function to fetch all pages of results
async function fetchAllPages(initialUrl) {
  let results = [];
  let nextPageToken = null;
  let url = initialUrl;
  
  do {
    try {
      // Wait 2 seconds if using a next page token (required by Google API)
      if (nextPageToken) {
        await new Promise(res => setTimeout(res, 2000));
        // Corrected to use pagetoken (lowercase for the old API)
        url = `${initialUrl}&pagetoken=${nextPageToken}`
      }
      
      const response = await axios.get(url);
      
      // Add results from this page - using results for the old API
      if (response.data && response.data.results) {
        results = results.concat(response.data.results);
      }
      
      // Get next page token if available - old API uses next_page_token
      nextPageToken = response.data.next_page_token;
      
    } catch (error) {
      console.error('Error fetching data:', error.message);
      break;
    }
  } while (nextPageToken);
  
  return results;
}

// Define regions to search in Paraty to overcome the 60 results limitation
const regions = [
  { lat: -23.2196, lng: -44.7213, radius: 5000 }, // Centro histórico
  { lat: -23.2140, lng: -44.7250, radius: 5000 }, // Jabaquara
  { lat: -23.2300, lng: -44.7100, radius: 5000 }  // Trindade area
];

// Function to search by region to get more results
async function searchByRegion(query, type) {
  let allResults = [];
  
  for (const region of regions) {
    try {
      // Using the new Places API v1 endpoint
      const url = `https://places.googleapis.com/v1/places:searchText`;
      
      console.log(`Making request to region near ${region.lat},${region.lng}...`);
      
      // Create request body for the new API
      const requestBody = {
        textQuery: query,
        locationBias: {
          circle: {
            center: {
              latitude: region.lat,
              longitude: region.lng
            },
            radius: region.radius
          }
        },
        languageCode: "pt-BR",
        maxResultCount: 2
      };
      
      // Add type filter if specified
      if (type) {
        requestBody.includedType = type;
      }
      
      // Make POST request to the new API
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.businessStatus'
        }
      });
      
      // Process results from the new API format
      const places = response.data.places || [];
      console.log(`Found ${places.length} places in this region`);
      
      // Add unique results only (avoid duplicates)
      for (const place of places) {
        if (!allResults.some(r => r.place_id === place.id)) {
          // Transform to maintain compatibility with the rest of the code
          allResults.push({
            place_id: place.id,
            name: place.displayName?.text || place.displayName,
            business_status: place.businessStatus
          });
        }
      }
      
    } catch (error) {
      console.error(`Error searching in region ${region.lat},${region.lng}:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
  
  return allResults;
}

// Function to get detailed information for a place
async function getPlaceDetails(placeId) {
  // Using only the new Places API v1 endpoint
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const fields = "displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,businessStatus,priceLevel";
  
  try {
    const response = await axios.get(url, {
      params: {
        key: apiKey
      },
      headers: {
        'X-Goog-FieldMask': fields
      }
    });
    
    // Transform the response to match the format expected by enrichPlaces
    return {
      name: response.data.displayName?.text || response.data.displayName,
      formatted_address: response.data.formattedAddress,
      formatted_phone_number: response.data.nationalPhoneNumber,
      website: response.data.websiteUri,
      rating: response.data.rating,
      user_ratings_total: response.data.userRatingCount,
      business_status: response.data.businessStatus,
      price_level: response.data.priceLevel
    };
  } catch (error) {
    console.error(`Error fetching details for place ID ${placeId}:`, error.message);
    return null;
  }
}

// Remove the getPlaceDetailsLegacy function entirely

// Function to enrich places with detailed information
async function enrichPlaces(places) {
  const enrichedPlaces = [];
  
  console.log(`Enriching ${places.length} places with detailed information...`);
  
  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < places.length; i += batchSize) {
    const batch = places.slice(i, i + batchSize);
    
    // Process batch in parallel
    const detailPromises = batch.map(place => getPlaceDetails(place.place_id));
    const detailsResults = await Promise.all(detailPromises);
    
    // Add enriched places
    for (const details of detailsResults) {
      if (details) {
        enrichedPlaces.push({
          name: details.name,
          address: details.formatted_address,
          phoneNumber: details.formatted_phone_number || 'No phone number',
          website: details.website || 'No website',
          rating: details.rating || 'No rating',
          totalRatings: details.user_ratings_total || 0,
          status: details.business_status || 'Unknown',
          priceLevel: details.price_level ? '💰'.repeat(details.price_level) : 'Not available'
        });
      }
    }
    
    // Wait a bit between batches to avoid rate limiting
    if (i + batchSize < places.length) {
      console.log(`Processed ${i + batch.length} of ${places.length} places. Waiting before next batch...`);
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  
  return enrichedPlaces;
}

// Function to display detailed information about places
function displayPlaceDetails(places) {
  return places.map(place => ({
    name: place.name,
    address: place.address,
    phoneNumber: place.phoneNumber,
    website: place.website,
    rating: place.rating,
    totalRatings: place.totalRatings,
    status: place.status,
    priceLevel: place.priceLevel
  }));
}

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
    const fs = require('fs');
    fs.writeFileSync('paraty-restaurants.json', JSON.stringify(enrichedRestaurants, null, 2));
    console.log('Restaurant data saved to paraty-restaurants.json');
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
    const fs = require('fs');
    fs.writeFileSync('paraty-inns.json', JSON.stringify(enrichedInns, null, 2));
    console.log('Inn data saved to paraty-inns.json');
  }
}

// Only run the main function if this file is being executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('An error occurred:', error);
  });
}

// Export functions for testing
module.exports = {
  fetchAllPages,
  searchByRegion,
  getPlaceDetails,
  enrichPlaces,
  displayPlaceDetails
};