// src/services/searchService.test.js
const { searchByRegion, regions } = require('./searchService');
const placesApi = require('../api/placesApi');

// Mock do módulo placesApi
jest.mock('../api/placesApi');

describe('Search Service Module', () => {
  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchByRegion', () => {
    test('should aggregate results from all regions and remove duplicates', async () => {
      // Configurar mocks para simular respostas da API para cada região
      placesApi.searchPlaces
        .mockResolvedValueOnce([
          { place_id: 'place1', name: 'Restaurant 1', business_status: 'OPERATIONAL' },
          { place_id: 'place2', name: 'Restaurant 2', business_status: 'CLOSED_TEMPORARILY' }
        ])
        .mockResolvedValueOnce([
          { place_id: 'place2', name: 'Restaurant 2', business_status: 'CLOSED_TEMPORARILY' }, // Duplicado
          { place_id: 'place3', name: 'Restaurant 3', business_status: 'OPERATIONAL' }
        ])
        .mockResolvedValueOnce([
          { place_id: 'place4', name: 'Restaurant 4', business_status: 'OPERATIONAL' }
        ]);

      // Chamar a função
      const result = await searchByRegion('restaurantes em Paraty', 'restaurant');

      // Verificar resultado
      expect(result).toHaveLength(4); // 4 resultados únicos
      expect(placesApi.searchPlaces).toHaveBeenCalledTimes(3); // Chamado para cada região
      
      // Verificar se os IDs estão corretos (sem duplicatas)
      const placeIds = result.map(place => place.place_id);
      expect(placeIds).toContain('place1');
      expect(placeIds).toContain('place2');
      expect(placeIds).toContain('place3');
      expect(placeIds).toContain('place4');
    });

    test('should handle API errors gracefully', async () => {
      // Configurar mock para simular erro na primeira região e sucesso nas outras
      placesApi.searchPlaces
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce([
          { place_id: 'place3', name: 'Restaurant 3', business_status: 'OPERATIONAL' }
        ])
        .mockResolvedValueOnce([
          { place_id: 'place4', name: 'Restaurant 4', business_status: 'OPERATIONAL' }
        ]);

      // Chamar a função
      const result = await searchByRegion('restaurantes em Paraty', 'restaurant');

      // Verificar resultado
      expect(result).toHaveLength(2); // Apenas os resultados das regiões bem-sucedidas
      expect(placesApi.searchPlaces).toHaveBeenCalledTimes(3);
    });
  });

  describe('regions', () => {
    test('should have the correct regions defined', () => {
      expect(regions).toHaveLength(3);
      expect(regions[0]).toHaveProperty('lat');
      expect(regions[0]).toHaveProperty('lng');
      expect(regions[0]).toHaveProperty('radius');
    });
  });
});