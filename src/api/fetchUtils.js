// src/api/fetchUtils.js
// Funções utilitárias para requisições HTTP

const axios = require('axios');

/**
 * Busca todas as páginas de resultados de uma URL inicial
 * @param {string} initialUrl - URL inicial para buscar resultados
 * @returns {Promise<Array>} - Todos os resultados combinados
 */
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

module.exports = {
  fetchAllPages
};