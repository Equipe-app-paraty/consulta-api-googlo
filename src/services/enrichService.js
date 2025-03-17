// src/services/enrichService.js
// Lógica para enriquecer os dados com detalhes

const { getPlaceDetails } = require('../api/placesApi');

/**
 * Enriquece lugares com informações detalhadas
 * @param {Array} places - Lista de lugares para enriquecer
 * @param {number} batchSize - Tamanho do lote para processamento (padrão: 5)
 * @param {number} delayBetweenBatches - Atraso entre lotes em ms (padrão: 1000)
 * @returns {Promise<Array>} - Lista de lugares enriquecidos
 */
async function enrichPlaces(places, batchSize = 5, delayBetweenBatches = 1000) {
  const enrichedPlaces = [];
  
  console.log(`Enriching ${places.length} places with detailed information...`);
  
  // Process in batches to avoid rate limiting
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
      await new Promise(res => setTimeout(res, delayBetweenBatches));
    }
  }
  
  return enrichedPlaces;
}

module.exports = {
  enrichPlaces
};