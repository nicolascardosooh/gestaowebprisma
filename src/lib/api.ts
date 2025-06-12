import axios from 'axios';

// Criando uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: '/api', // Base URL para todas as requisições
  timeout: 10000, // Timeout de 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação em todas as requisições
api.interceptors.request.use((config) => {
  // Verifica se está no browser antes de acessar localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros comuns
    if (error.response) {
      // Erro de resposta do servidor (status code fora do range 2xx)
      if (error.response.status === 401) {
        // Não autorizado - redirecionar para login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('Erro de conexão com o servidor');
    } else {
      // Erro na configuração da requisição
      console.error('Erro ao configurar requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Funções auxiliares para simplificar as chamadas
const apiService = {
  // GET request
  get: async <T>(url: string, params?: any): Promise<T> => {
    const response = await api.get<T>(url, { params });
    return response.data;
  },
  
  // POST request
  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.post<T>(url, data);
    return response.data;
  },
  
  // PUT request
  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.put<T>(url, data);
    return response.data;
  },
  
  // DELETE request
  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<T>(url);
    return response.data;
  },
  
  // PATCH request
  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<T>(url, data);
    return response.data;
  }
};

export default apiService;