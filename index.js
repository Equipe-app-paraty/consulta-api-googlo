// Arquivo principal que importa e executa o código modularizado
require('./src/main');

// Exporta todas as funções para manter compatibilidade com código existente
module.exports = {
  ...require('./src/api/fetchUtils'),
  ...require('./src/api/placesApi'),
  ...require('./src/services/searchService'),
  ...require('./src/services/enrichService'),
  ...require('./src/utils/displayUtils'),
  ...require('./src/main')
};