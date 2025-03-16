// src/utils/displayUtils.js
// Funções para exibir resultados no console

/**
 * Formata detalhes de lugares para exibição
 * @param {Array} places - Lista de lugares para exibir
 * @returns {Array} - Lista formatada para exibição
 */
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

/**
 * Salva dados em um arquivo JSON
 * @param {string} filename - Nome do arquivo
 * @param {Object} data - Dados a serem salvos
 */
function saveToFile(filename, data) {
  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filename}`);
}

module.exports = {
  displayPlaceDetails,
  saveToFile
};