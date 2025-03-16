// src/api/placesApi.js
// Funções para interagir com a API do Google Places

const axios = require('axios');
require('dotenv').config();

// Get API key from environment variables
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Busca lugares usando a API Places v1 com uma consulta de texto
 * @param {string} query - Consulta de texto para buscar lugares
 * @param {string} type - Tipo de lugar a ser buscado (ex: restaurant, lodging)
 * @param {Object} region - Região para buscar (lat, lng, radius)
 * @returns {Promise<Array>} - Lista de lugares encontrados
 */
async function searchPlaces(query, type, region) {
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
      maxResultCount: 20
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
    
    // Transform to maintain compatibility with the rest of the code
    return places.map(place => ({
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      business_status: place.businessStatus
    }));
    
  } catch (error) {
    console.error(`Error searching in region ${region.lat},${region.lng}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

/**
 * Obtém detalhes de um lugar específico usando seu ID
 * @param {string} placeId - ID do lugar
 * @returns {Promise<Object|null>} - Detalhes do lugar ou null em caso de erro
 */
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

module.exports = {
  searchPlaces,
  getPlaceDetails,
  apiKey
};