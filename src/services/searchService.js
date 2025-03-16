// src/services/searchService.js
// Lógica para buscar restaurantes e pousadas

const { searchPlaces } = require('../api/placesApi');

// Define regions to search in Paraty to overcome the 60 results limitation
const regions = [
  { lat: -23.2196, lng: -44.7213, radius: 5000 }, // Centro histórico
  { lat: -23.2140, lng: -44.7250, radius: 5000 }, // Jabaquara
  { lat: -23.2300, lng: -44.7100, radius: 5000 }  // Trindade area
];

/**
 * Busca lugares por região para obter mais resultados
 * @param {string} query - Consulta de texto para buscar lugares
 * @param {string} type - Tipo de lugar a ser buscado (ex: restaurant, lodging)
 * @returns {Promise<Array>} - Lista de lugares encontrados
 */
async function searchByRegion(query, type) {
  let allResults = [];
  
  for (const region of regions) {
    try {
      const places = await searchPlaces(query, type, region);
      
      // Add unique results only (avoid duplicates)
      for (const place of places) {
        if (!allResults.some(r => r.place_id === place.place_id)) {
          allResults.push(place);
        }
      }
      
    } catch (error) {
      console.error(`Error searching in region ${region.lat},${region.lng}:`, error.message);
    }
  }
  
  return allResults;
}

module.exports = {
  searchByRegion,
  regions
};