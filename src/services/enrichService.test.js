// src/services/enrichService.test.js
const { enrichPlaces } = require('./enrichService');
const placesApi = require('../api/placesApi');

// Mock do módulo placesApi
jest.mock('../api/placesApi');

describe('Enrich Service Module', () => {
  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enrichPlaces', () => {
    const mockPlaces = [
      { place_id: 'place1', name: 'Restaurant 1', business_status: 'OPERATIONAL' },
      { place_id: 'place2', name: 'Restaurant 2', business_status: 'OPERATIONAL' },
      { place_id: 'place3', name: 'Restaurant 3', business_status: 'OPERATIONAL' }
    ];

    const mockDetails = [
      {
        name: 'Restaurant 1 Full',
        formatted_address: 'Rua 1, Paraty',
        formatted_phone_number: '(24) 1111-1111',
        website: 'https://restaurant1.com',
        rating: 4.5,
        user_ratings_total: 100,
        business_status: 'OPERATIONAL',
        price_level: 2
      },
      {
        name: 'Restaurant 2 Full',
        formatted_address: 'Rua 2, Paraty',
        formatted_phone_number: '(24) 2222-2222',
        website: 'https://restaurant2.com',
        rating: 4.0,
        user_ratings_total: 80,
        business_status: 'OPERATIONAL',
        price_level: 3
      },
      null // Simular falha ao obter detalhes para o terceiro lugar
    ];

    test('should enrich places with detailed information', async () => {
      // Configurar mocks para simular respostas da API para cada lugar
      placesApi.getPlaceDetails
        .mockResolvedValueOnce(mockDetails[0])
        .mockResolvedValueOnce(mockDetails[1])
        .mockResolvedValueOnce(mockDetails[2]);

      // Chamar a função
      const result = await enrichPlaces(mockPlaces);

      // Verificar resultado
      expect(result).toHaveLength(2); // Apenas os lugares com detalhes válidos
      expect(placesApi.getPlaceDetails).toHaveBeenCalledTimes(3);
      
      // Verificar se os detalhes foram transformados corretamente
      expect(result[0].name).toBe('Restaurant 1 Full');
      expect(result[0].address).toBe('Rua 1, Paraty');
      expect(result[0].phoneNumber).toBe('(24) 1111-1111');
      expect(result[0].website).toBe('https://restaurant1.com');
      expect(result[0].priceLevel).toBe('💰💰');
      
      expect(result[1].name).toBe('Restaurant 2 Full');
      expect(result[1].priceLevel).toBe('💰💰💰');
    });

    test('should handle missing details gracefully', async () => {
      // Configurar mock para simular detalhes parciais
      const partialDetails = {
        name: 'Restaurant Partial',
        formatted_address: 'Rua Partial, Paraty',
        // Sem telefone e website
        rating: 3.5,
        user_ratings_total: 50,
        business_status: 'OPERATIONAL'
        // Sem price_level
      };
      
      placesApi.getPlaceDetails.mockResolvedValueOnce(partialDetails);

      // Chamar a função com apenas um lugar
      const result = await enrichPlaces([mockPlaces[0]]);

      // Verificar resultado
      expect(result).toHaveLength(1);
      expect(result[0].phoneNumber).toBe('No phone number');
      expect(result[0].website).toBe('No website');
      expect(result[0].priceLevel).toBe('Not available');
    });
  });
});