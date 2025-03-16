// src/api/placesApi.test.js
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { searchPlaces, getPlaceDetails } = require('./placesApi');

// Mock do axios para testes
const mock = new MockAdapter(axios);

describe('Places API Module', () => {
  // Limpar mocks após cada teste
  afterEach(() => {
    mock.reset();
  });

  describe('searchPlaces', () => {
    const region = { lat: -23.2196, lng: -44.7213, radius: 5000 };
    
    test('should return transformed places data on successful API call with text property', async () => {
      const mockResponse = {
        places: [
          {
            id: 'place123',
            displayName: { text: 'Test Restaurant' },
            businessStatus: 'OPERATIONAL'
          },
          {
            id: 'place456',
            displayName: { text: 'Another Restaurant' },
            businessStatus: 'CLOSED_TEMPORARILY'
          }
        ]
      };
      
      // Configurar mock para simular resposta da API
      mock.onPost('https://places.googleapis.com/v1/places:searchText').reply(200, mockResponse);

      // Chamar a função
      const result = await searchPlaces('restaurantes em Paraty', 'restaurant', region);

      // Verificar resultado
      expect(result).toHaveLength(2);
      expect(result[0].place_id).toBe('place123');
      expect(result[0].name).toBe('Test Restaurant');
      expect(result[0].business_status).toBe('OPERATIONAL');
    });
    
    test('should return transformed places data with direct displayName string', async () => {
      const mockResponse = {
        places: [
          {
            id: 'place123',
            displayName: 'Direct Restaurant Name',
            businessStatus: 'OPERATIONAL'
          }
        ]
      };
      
      // Configurar mock para simular resposta da API
      mock.onPost('https://places.googleapis.com/v1/places:searchText').reply(200, mockResponse);

      // Chamar a função
      const result = await searchPlaces('restaurantes em Paraty', 'restaurant', region);

      // Verificar resultado
      expect(result).toHaveLength(1);
      expect(result[0].place_id).toBe('place123');
      expect(result[0].name).toBe('Direct Restaurant Name');
      expect(result[0].business_status).toBe('OPERATIONAL');
    });
    
    test('should handle empty places array in response', async () => {
      const mockResponse = { places: [] };
      
      // Configurar mock para simular resposta da API
      mock.onPost('https://places.googleapis.com/v1/places:searchText').reply(200, mockResponse);

      // Chamar a função
      const result = await searchPlaces('restaurantes em Paraty', 'restaurant', region);

      // Verificar resultado
      expect(result).toEqual([]);
    });
    
    test('should handle missing places property in response', async () => {
      const mockResponse = { someOtherProperty: 'value' };
      
      // Configurar mock para simular resposta da API
      mock.onPost('https://places.googleapis.com/v1/places:searchText').reply(200, mockResponse);

      // Chamar a função
      const result = await searchPlaces('restaurantes em Paraty', 'restaurant', region);

      // Verificar resultado
      expect(result).toEqual([]);
    });

    test('should return empty array on API error', async () => {
      // Configurar mock para simular erro da API
      mock.onPost('https://places.googleapis.com/v1/places:searchText').reply(500);

      // Chamar a função
      const result = await searchPlaces('restaurantes em Paraty', 'restaurant', region);

      // Verificar resultado
      expect(result).toEqual([]);
    });
  });

  describe('getPlaceDetails', () => {
    test('should return transformed place details with text property', async () => {
      const mockResponse = {
        displayName: { text: 'Test Restaurant' },
        formattedAddress: 'Rua Teste, 123, Paraty',
        nationalPhoneNumber: '(24) 1234-5678',
        websiteUri: 'https://example.com',
        rating: 4.5,
        userRatingCount: 100,
        businessStatus: 'OPERATIONAL',
        priceLevel: 2
      };
      
      // Configurar mock para simular resposta da API
      mock.onGet('https://places.googleapis.com/v1/places/place123').reply(200, mockResponse);

      // Chamar a função
      const result = await getPlaceDetails('place123');

      // Verificar resultado
      expect(result.name).toBe('Test Restaurant');
      expect(result.formatted_address).toBe('Rua Teste, 123, Paraty');
      expect(result.formatted_phone_number).toBe('(24) 1234-5678');
      expect(result.website).toBe('https://example.com');
      expect(result.rating).toBe(4.5);
      expect(result.user_ratings_total).toBe(100);
      expect(result.business_status).toBe('OPERATIONAL');
      expect(result.price_level).toBe(2);
    });
    
    test('should return transformed place details with direct displayName string', async () => {
      const mockResponse = {
        displayName: 'Direct Restaurant Name',
        formattedAddress: 'Rua Teste, 123, Paraty',
        nationalPhoneNumber: '(24) 1234-5678',
        websiteUri: 'https://example.com',
        rating: 4.5,
        userRatingCount: 100,
        businessStatus: 'OPERATIONAL',
        priceLevel: 2
      };
      
      // Configurar mock para simular resposta da API
      mock.onGet('https://places.googleapis.com/v1/places/place123').reply(200, mockResponse);

      // Chamar a função
      const result = await getPlaceDetails('place123');

      // Verificar resultado
      expect(result.name).toBe('Direct Restaurant Name');
      expect(result.formatted_address).toBe('Rua Teste, 123, Paraty');
    });

    test('should return null on API error', async () => {
      // Configurar mock para simular erro da API
      mock.onGet('https://places.googleapis.com/v1/places/place123').reply(500);

      // Chamar a função
      const result = await getPlaceDetails('place123');

      // Verificar resultado
      expect(result).toBeNull();
    });
  });
});