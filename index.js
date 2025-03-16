// Arquivo principal que importa e executa o código modularizado
console.log('Iniciando aplicação...');
const { main } = require('./src/main');
console.log('Módulo main.js carregado');

// Execute the main function
console.log('Executando função principal...');
main().catch(error => {
  console.error('An error occurred:', error);
});

// Exporta todas as funções para manter compatibilidade com código existente
module.exports = {
  ...require('./src/api/fetchUtils'),
  ...require('./src/api/placesApi'),
  ...require('./src/services/searchService'),
  ...require('./src/services/enrichService'),
  ...require('./src/utils/displayUtils'),
  ...require('./src/main')
};