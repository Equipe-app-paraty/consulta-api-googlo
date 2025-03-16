// src/utils/displayUtils.test.js
const fs = require('fs');
const { displayPlaceDetails, saveToFile } = require('./displayUtils');

// Mock do módulo fs
jest.mock('fs');

describe('Display Utils Module', () => {
  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('displayPlaceDetails', () => {
    const mockPlaces = [
      {
        name: 'Restaurant 1',
        address: 'Rua 1, Paraty',
        phoneNumber: '(24) 1111-1111',
        website: 'https://restaurant1.com',
        rating: 4.5,
        totalRatings: 100,
        status: 'OPERATIONAL',
        priceLevel: '💰💰'
      },
      {
        name: 'Restaurant 2',
        address: 'Rua 2, Paraty',
        phoneNumber: 'No phone number',
        website: 'No website',
        rating: 'No rating',
        totalRatings: 0,
        status: 'CLOSED_TEMPORARILY',
        priceLevel: 'Not available'
      }
    ];

    test('should format place details for display', () => {
      // Chamar a função
      const result = displayPlaceDetails(mockPlaces);

      // Verificar resultado
      expect(result).toHaveLength(2);
      
      // Verificar se os campos foram mantidos corretamente
      expect(result[0]).toEqual({
        name: 'Restaurant 1',
        address: 'Rua 1, Paraty',
        phoneNumber: '(24) 1111-1111',
        website: 'https://restaurant1.com',
        rating: 4.5,
        totalRatings: 100,
        status: 'OPERATIONAL',
        priceLevel: '💰💰'
      });
      
      expect(result[1]).toEqual({
        name: 'Restaurant 2',
        address: 'Rua 2, Paraty',
        phoneNumber: 'No phone number',
        website: 'No website',
        rating: 'No rating',
        totalRatings: 0,
        status: 'CLOSED_TEMPORARILY',
        priceLevel: 'Not available'
      });
    });

    test('should handle empty input', () => {
      // Chamar a função com array vazio
      const result = displayPlaceDetails([]);

      // Verificar resultado
      expect(result).toEqual([]);
    });
  });

  describe('saveToFile', () => {
    test('should save data to file as JSON', () => {
      // Dados de teste
      const filename = 'test-data.json';
      const data = { key: 'value', items: [1, 2, 3] };
      
      // Chamar a função
      saveToFile(filename, data);
      
      // Verificar se writeFileSync foi chamado com os parâmetros corretos
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filename,
        JSON.stringify(data, null, 2)
      );
    });

    test('should log a message after saving', () => {
      // Espionar console.log
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Chamar a função
      saveToFile('test.json', {});
      
      // Verificar se a mensagem foi logada
      expect(consoleSpy).toHaveBeenCalledWith('Data saved to test.json');
      
      // Restaurar console.log
      consoleSpy.mockRestore();
    });
  });
});