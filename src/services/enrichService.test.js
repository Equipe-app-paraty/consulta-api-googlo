// src/services/enrichService.test.js
const { enrichPlaces } = require('./enrichService');
const placesApi = require('../api/placesApi');

// Mock do módulo placesApi
jest.mock('../api/placesApi');

describe('Enrich Service Module', () => {
  // Setup para os testes
  beforeEach(() => {
    // Configurar o mock do setTimeout corretamente
    jest.useFakeTimers();
  });

  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
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

    // Increase timeout to 10 seconds and fix the timer handling
    test('should process places in batches with timeout between batches', async () => {
      // Configure mock to return the same details for all places
      placesApi.getPlaceDetails.mockResolvedValue(mockDetails);

      // Start the enrichment process
      const enrichPromise = enrichPlaces(mockPlaces);
      
      // Run only pending timers (not all timers) to avoid infinite loops
      jest.runOnlyPendingTimers();
      
      // Now await the completion
      const result = await enrichPromise;
      
      // Verify results
      expect(result.length).toBe(mockPlaces.length); 
      expect(placesApi.getPlaceDetails).toHaveBeenCalledTimes(mockPlaces.length);
      
      // Verify setTimeout was called
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    }, 10000); // Increase timeout to 10 seconds

    test('should enrich places with detailed information', async () => {
      // Criar mocks de detalhes específicos para cada lugar
      const mockDetailsArray = [
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
          rating: 4.8,
          user_ratings_total: 200,
          business_status: 'OPERATIONAL',
          price_level: 3
        },
        null // Simular um lugar sem detalhes
      ];
      
      // Configurar mock para retornar detalhes diferentes para cada lugar
      placesApi.getPlaceDetails
        .mockResolvedValueOnce(mockDetailsArray[0])
        .mockResolvedValueOnce(mockDetailsArray[1])
        .mockResolvedValueOnce(mockDetailsArray[2]);
      
      // Chamar a função com apenas 3 lugares para corresponder aos mocks
      const result = await enrichPlaces(mockPlaces.slice(0, 3));
      
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
    
    // Fix the test for the last batch
    test('should not wait between batches for the last batch', async () => {
      // Create a mock implementation of enrichService that we can control
      // We need to use a small array that won't trigger the setTimeout
      const smallBatchPlaces = mockPlaces.slice(0, 5); // Exactly one batch
      
      // Reset the mock before this test
      jest.clearAllMocks();
      placesApi.getPlaceDetails.mockResolvedValue(mockDetails);
      
      // Call the function
      await enrichPlaces(smallBatchPlaces);
      
      // Since we're using exactly one batch size, the condition at line 33-35
      // (i + batchSize < places.length) should be false, and setTimeout shouldn't be called
      expect(setTimeout).not.toHaveBeenCalled();
    });
  });
});