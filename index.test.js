const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Create a mock for Axios
const mock = new MockAdapter(axios);

// Import the functions after setting up the mock
const {
  fetchAllPages,
  searchPlaces,
  displayPlaceDetails
} = require('./index');

describe('Google Places API Functions', () => {
  beforeEach(() => {
    // Reset the Axios mock before each test
    mock.reset();
  });

  afterAll(() => {
    // Clean up
    mock.restore();
  });

  describe('fetchAllPages', () => {
    it('should fetch all pages of results', async () => {
      // Mock first page response
      mock.onGet().reply(function(config) {
        if (config.url.includes('pageToken=next-page-token')) {
          return [200, {
            places: [
              { name: 'Place 2', formattedAddress: 'Address 2', phoneNumber: '1234567890' },
              { name: 'Place 3', formattedAddress: 'Address 3', phoneNumber: '0987654321' }
            ],
            nextPageToken: null
          }];
        } else {
          return [200, {
            places: [
              { name: 'Place 1', formattedAddress: 'Address 1', phoneNumber: '1112223333' }
            ],
            nextPageToken: 'next-page-token'
          }];
        }
      });

      const results = await fetchAllPages('https://places.google.com/v1/textSearch?query=test&key=test-API_KEY&fields=places.name,places.formattedAddress,places.phoneNumber');
      
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('Place 1');
      expect(results[1].name).toBe('Place 2');
      expect(results[2].name).toBe('Place 3');
    });

    it('should handle empty results', async () => {
      mock.onGet().reply(200, {
        places: [],
        status: 'ZERO_RESULTS'
      });

      const results = await fetchAllPages('https://places.google.com/v1/textSearch?query=nonexistent&key=test-API_KEY&fields=places.name');
      
      expect(results).toHaveLength(0);
    });

    it('should handle server errors gracefully', async () => {
      mock.onGet().reply(500);

      const results = await fetchAllPages('https://places.google.com/v1/textSearch?query=error&key=test-API_KEY&fields=places.name');
      
      expect(results).toHaveLength(0);
    });

    it('should handle client errors gracefully', async () => {
      mock.onGet().reply(400, { 
        status: 'REQUEST_DENIED',
        error_message: 'API key not authorized'
      });

      const results = await fetchAllPages('https://places.google.com/v1/textSearch?query=error&key=test-API_KEY&fields=places.name');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('searchPlaces', () => {
    it('should search for places with the given query', async () => {
      mock.onGet().reply(200, {
        places: [
          { name: 'Test Place 1', formattedAddress: 'Address 1', phoneNumber: '1234567890', businessStatus: 'OPERATIONAL' },
          { name: 'Test Place 2', formattedAddress: 'Address 2', phoneNumber: '0987654321', businessStatus: 'OPERATIONAL' }
        ]
      });

      const result = await searchPlaces('test');
      
      expect(result.count).toBe(2);
      expect(result.places).toHaveLength(2);
      expect(result.places[0].name).toBe('Test Place 1');
      expect(result.places[1].formattedAddress).toBe('Address 2');
    });

    it('should include type parameter when provided', async () => {
      mock.onGet(new RegExp('.*type=restaurant')).reply(200, {
        places: [
          { name: 'Test Restaurant', formattedAddress: 'Restaurant Address', phoneNumber: '1112223333', businessStatus: 'OPERATIONAL' }
        ]
      });

      const result = await searchPlaces('test', 'restaurant');
      
      expect(result.count).toBe(1);
      expect(result.places[0].name).toBe('Test Restaurant');
    });

    it('should handle zero results', async () => {
      mock.onGet().reply(200, {
        places: [],
        status: 'ZERO_RESULTS'
      });

      const result = await searchPlaces('nonexistent');
      
      expect(result.count).toBe(0);
      expect(result.places).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      mock.onGet().reply(400, { 
        status: 'REQUEST_DENIED',
        error_message: 'API key not authorized'
      });

      const result = await searchPlaces('error');
      
      expect(result.count).toBe(0);
      expect(result.places).toHaveLength(0);
    });
  });

  describe('displayPlaceDetails', () => {
    it('should format place details correctly', () => {
      const places = [
        {
          name: 'Test Place',
          formattedAddress: '123 Test St',
          phoneNumber: '1234567890',
          rating: 4.5,
          userRatingsTotal: 100,
          businessStatus: 'OPERATIONAL',
          priceLevel: 2
        }
      ];

      const result = displayPlaceDetails(places);
      
      expect(result[0].name).toBe('Test Place');
      expect(result[0].address).toBe('123 Test St');
      expect(result[0].phoneNumber).toBe('1234567890');
      expect(result[0].rating).toBe(4.5);
      expect(result[0].totalRatings).toBe(100);
      expect(result[0].status).toBe('OPERATIONAL');
      expect(result[0].priceLevel).toBe('💰💰');
    });

    it('should handle missing fields gracefully', () => {
      const places = [
        {
          name: 'Test Place',
          formattedAddress: '123 Test St',
          // Missing phoneNumber
        }
      ];

      const result = displayPlaceDetails(places);
      
      expect(result[0].name).toBe('Test Place');
      expect(result[0].address).toBe('123 Test St');
      expect(result[0].phoneNumber).toBe('No phone number');
      expect(result[0].rating).toBe('No rating');
      expect(result[0].totalRatings).toBe(0);
      expect(result[0].status).toBe('Unknown');
      expect(result[0].priceLevel).toBe('Not available');
    });

    it('should handle multiple price levels correctly', () => {
      const places = [
        { name: 'Cheap Place', formattedAddress: 'Address 1', priceLevel: 1 },
        { name: 'Moderate Place', formattedAddress: 'Address 2', priceLevel: 2 },
        { name: 'Expensive Place', formattedAddress: 'Address 3', priceLevel: 3 },
        { name: 'Very Expensive Place', formattedAddress: 'Address 4', priceLevel: 4 }
      ];

      const result = displayPlaceDetails(places);
      
      expect(result[0].priceLevel).toBe('💰');
      expect(result[1].priceLevel).toBe('💰💰');
      expect(result[2].priceLevel).toBe('💰💰💰');
      expect(result[3].priceLevel).toBe('💰💰💰💰');
    });

    it('should handle empty places array', () => {
      const places = [];
      const result = displayPlaceDetails(places);
      expect(result).toEqual([]);
    });
  });

  describe('Integration tests', () => {
    it('should search and format restaurant results', async () => {
      // Mock the API response for restaurants
      mock.onGet(new RegExp('.*restaurantes.*type=restaurant')).reply(200, {
        places: [
          { 
            name: 'Restaurant 1', 
            formattedAddress: 'Address 1, Paraty, Brazil',
            phoneNumber: '1234567890',
            rating: 4.8,
            userRatingsTotal: 150,
            businessStatus: 'OPERATIONAL',
            priceLevel: 2
          },
          { 
            name: 'Restaurant 2', 
            formattedAddress: 'Address 2, Paraty, Brazil',
            phoneNumber: '0987654321',
            rating: 4.5,
            userRatingsTotal: 120,
            businessStatus: 'OPERATIONAL',
            priceLevel: 3
          }
        ]
      });

      const restaurants = await searchPlaces('restaurantes em Paraty', 'restaurant');
      const formattedRestaurants = displayPlaceDetails(restaurants.places);
      
      expect(restaurants.count).toBe(2);
      expect(formattedRestaurants[0].name).toBe('Restaurant 1');
      expect(formattedRestaurants[0].rating).toBe(4.8);
      expect(formattedRestaurants[1].priceLevel).toBe('💰💰💰');
    });

    it('should search and format inn results', async () => {
      // Mock the API response for inns
      mock.onGet(new RegExp('.*pousadas.*type=lodging')).reply(200, {
        places: [
          { 
            name: 'Pousada 1', 
            formattedAddress: 'Address 1, Paraty, Brazil',
            phoneNumber: '1112223333',
            rating: 4.9,
            userRatingsTotal: 80,
            businessStatus: 'OPERATIONAL'
          },
          { 
            name: 'Pousada 2', 
            formattedAddress: 'Address 2, Paraty, Brazil',
            phoneNumber: '4445556666',
            rating: 4.7,
            userRatingsTotal: 65,
            businessStatus: 'OPERATIONAL',
            priceLevel: 2
          }
        ]
      });

      const inns = await searchPlaces('pousadas em Paraty', 'lodging');
      const formattedInns = displayPlaceDetails(inns.places);
      
      expect(inns.count).toBe(2);
      expect(formattedInns[0].name).toBe('Pousada 1');
      expect(formattedInns[0].priceLevel).toBe('Not available');
      expect(formattedInns[1].rating).toBe(4.7);
    });
  });
});