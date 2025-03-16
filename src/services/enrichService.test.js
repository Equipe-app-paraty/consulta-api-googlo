// src/services/enrichService.test.js
const { enrichPlaces } = require('./enrichService');
const placesApi = require('../api/placesApi');

// Mock do módulo placesApi
jest.mock('../api/placesApi');

// Mock for setTimeout
jest.useFakeTimers();

describe('Enrich Service Module', () => {
  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('enrichPlaces', () => {
    const mockPlaces = [
      { place_id: 'place1', name: 'Restaurant 1', business_status: 'OPERATIONAL' },
      { place_id: 'place2', name: 'Restaurant 2', business_status: 'OPERATIONAL' },
      { place_id: 'place3', name: 'Restaurant 3', business_status: 'OPERATIONAL' },
      { place_id: 'place4', name: 'Restaurant 4', business_status: 'OPERATIONAL' },
      { place_id: 'place5', name: 'Restaurant 5', business_status: 'OPERATIONAL' },
      { place_id: 'place6', name: 'Restaurant 6', business_status: 'OPERATIONAL' }
    ];

    const mockDetails = {
      name: 'Restaurant Full',
      formatted_address: 'Rua Test, Paraty',
      formatted_phone_number: '(24) 1111-1111',
      website: 'https://restaurant.com',
      rating: 4.5,
      user_ratings_total: 100,
      business_status: 'OPERATIONAL',
      price_level: 2
    };

    test('should process places in batches with timeout between batches', async () => {
      // Configure mock to return the same details for all places
      placesApi.getPlaceDetails.mockResolvedValue(mockDetails);

      // Start the enrichment process
      const enrichPromise = enrichPlaces(mockPlaces);
      
      // Fast-forward timers to trigger the timeout between batches
      jest.advanceTimersByTime(1000);
      
      // Wait for the enrichment to complete
      const result = await enrichPromise;
      
      // Verify results
      expect(result.length).toBe(mockPlaces.length);
      expect(placesApi.getPlaceDetails).toHaveBeenCalledTimes(mockPlaces.length);
      
      // Verify the timeout was used
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

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