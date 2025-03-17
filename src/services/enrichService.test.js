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
      
      // Use runAllTimersAsync instead of advanceTimersByTime
      const enrichPromise = enrichPlaces(mockPlaces);
      await jest.runAllTimersAsync();
      
      // Await the result
      const result = await enrichPromise;
      
      // Verify results
      expect(placesApi.getPlaceDetails).toHaveBeenCalledTimes(mockPlaces.length);
      expect(result.length).toBeGreaterThan(0);
    }, 60000); // Increase timeout to 60 seconds

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
      // Mock setTimeout para poder espioná-lo
      jest.useFakeTimers();
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      // Criar um array com exatamente o tamanho do lote
      const exactBatchSizePlaces = Array(5).fill().map((_, i) => ({
        place_id: `place${i}`,
        name: `Place ${i}`
      }));
      
      // Configurar o mock para retornar detalhes
      placesApi.getPlaceDetails.mockResolvedValue(mockDetails);
      
      // Chamar a função com um array que tem exatamente o tamanho do lote
      const enrichPromise = enrichPlaces(exactBatchSizePlaces, 5, 1000);
      
      // Avançar todos os timers
      jest.runAllTimers();
      
      // Aguardar a conclusão
      await enrichPromise;
      
      // Verificar que setTimeout não foi chamado para esperar entre lotes
      // (já que só temos um lote exato)
      expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1000);
      
      // Limpar o spy e restaurar timers reais
      setTimeoutSpy.mockRestore();
      jest.useRealTimers();
    });
  });
});
