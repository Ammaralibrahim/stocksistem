import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'حدث خطأ غير متوقع';
    
    if (error.response) {
      message = error.response.data?.message || error.response.statusText || 'خطأ في الخادم';
      
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      message = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت';
    } else {
      message = error.message;
    }
    
    return Promise.reject(new Error(message));
  }
);

// Cart methods
api.cart = {
  loadToCart: (drugId, quantity, cartId) => 
    api.post('/cart/load', { drugId, quantity, cartId }),
  
  unloadFromCart: (drugId, quantity, cartId) => 
    api.post('/cart/unload', { drugId, quantity, cartId }),
  
  unloadAll: (cartId, notes) => 
    api.post('/cart/unload-all', { cartId, notes }),
  
  quickSale: (data) => 
    api.post('/orders/cart-sale', data),
  
  getActive: () => api.get('/cart/active'),
  
  getTransfers: (cartId) => api.get(`/cart/${cartId}/transfers`),
  
  loadByBarcode: (barcode, quantity) => 
    api.post('/cart/load/barcode', { barcode, quantity }),
  
  getAll: () => api.get('/cart'),
  
  getById: (id) => api.get(`/cart/${id}`),
  
  create: (data) => api.post('/cart', data),
  
  update: (id, data) => api.put(`/cart/${id}`, data),
  
  delete: (id) => api.delete(`/cart/${id}`)
};

// Drug methods
api.drugs = {
  getAll: () => api.get('/drugs'),
  getById: (id) => api.get(`/drugs/${id}`),
  create: (data) => api.post('/drugs', data),
  update: (id, data) => api.put(`/drugs/${id}`, data),
  delete: (id) => api.delete(`/drugs/${id}`),
  search: (q) => api.get(`/drugs/search?q=${q}`),
  getLowStock: () => api.get('/drugs/low-stock'),
  getExpiring: () => api.get('/drugs/expiring-soon')
};

// Order methods
api.orders = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getToday: () => api.get('/orders/today'),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cartSale: (data) => api.post('/orders/cart-sale', data)
};

// Auth methods
api.auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Dashboard methods
api.dashboard = {
  getStats: () => api.get('/dashboard/stats'),
  getCartStats: () => api.get('/dashboard/cart-stats')
};

export default api;