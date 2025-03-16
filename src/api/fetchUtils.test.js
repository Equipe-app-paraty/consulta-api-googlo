// src/api/fetchUtils.test.js
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { fetchAllPages } = require('./fetchUtils');

// Mock do axios para testes
const mock = new MockAdapter(axios);

describe('Fetch Utils Module', () => {
  // Limpar mocks após cada teste
  afterEach(() => {
    mock.reset();
  });

  describe('fetchAllPages', () => {
    const initialUrl = 'https://api.example.com/data';
    
    test('should fetch single page when no next_page_token', async () => {
      // Configurar mock para simular resposta da API sem token de próxima página
      mock.onGet(initialUrl).reply(200, {
        results: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
      });

      // Chamar a função
      const result = await fetchAllPages(initialUrl);

      // Verificar resultado
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].name).toBe('Item 2');
    });

    test('should fetch multiple pages when next_page_token exists', async () => {
      // Configurar mock para simular resposta da primeira página com token
      mock.onGet(initialUrl).reply(200, {
        results: [{ id: 1, name: 'Item 1' }],
        next_page_token: 'token123'
      });

      // Configurar mock para simular resposta da segunda página sem token
      mock.onGet(`${initialUrl}&pagetoken=token123`).reply(200, {
        results: [{ id: 2, name: 'Item 2' }]
      });

      // Chamar a função
      const result = await fetchAllPages(initialUrl);

      // Verificar resultado
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    test('should handle API errors gracefully', async () => {
      // Configurar mock para simular erro da API
      mock.onGet(initialUrl).reply(500);

      // Chamar a função
      const result = await fetchAllPages(initialUrl);

      // Verificar resultado
      expect(result).toEqual([]);
    });
  });
});