// Small API client used by the frontend to talk to the backend API
(function(window){
  // Determine API base:
  // - If a global override `window.__API_BASE__` is set, use it.
  // - If page was opened via file://, assume a local dev server at http://localhost:4000
  // - Otherwise use a same-origin relative path '/api'.
  const DEFAULT_DEV_SERVER = 'http://localhost:4000';
  const apiBaseRoot = (window.__API_BASE__ && window.__API_BASE__.trim())
    ? window.__API_BASE__.replace(/\/$/, '')
    : (location.protocol === 'file:' ? DEFAULT_DEV_SERVER : '');
  const API_PREFIX = apiBaseRoot ? (apiBaseRoot + '/api') : '/api';

  function getToken(){
    return localStorage.getItem('token');
  }

  async function apiFetch(path, options = {}){
    const headers = options.headers ? { ...options.headers } : {};
    // If there is a body and it's not FormData, ensure Content-Type is set and
    // stringify plain objects before sending. This prevents missing req.body on server.
    if (options.body !== undefined && !(options.body instanceof FormData)) {
      if (typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_PREFIX + path, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      const err = new Error(text || res.statusText || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  window.api = {
    getProducts: () => apiFetch('/products'),
    getProduct: (id) => apiFetch(`/products/${id}`),
    createProduct: (payload) => apiFetch('/products', { method: 'POST', body: payload }),
    updateProduct: (id, payload) => apiFetch(`/products/${id}`, { method: 'PUT', body: payload }),
    deleteProduct: (id) => apiFetch(`/products/${id}`, { method: 'DELETE' }),

    // Orders
    getOrders: () => apiFetch('/orders'),
    getOrder: (id) => apiFetch(`/orders/${id}`),
    updateOrder: (id, payload) => apiFetch(`/orders/${id}`, { method: 'PUT', body: payload }),
    deleteOrder: (id) => apiFetch(`/orders/${id}`, { method: 'DELETE' }),

    register: (payload) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    getCart: () => apiFetch('/cart', { method: 'GET' }),
    updateCart: (cart) => apiFetch('/cart', { method: 'POST', body: JSON.stringify({ cart }) }),
    checkout: (payload) => apiFetch('/checkout', { method: 'POST', body: JSON.stringify(payload) }),

    // Ping the API health endpoint to check server availability
    ping: async () => {
      try {
        const res = await fetch(API_PREFIX + '/health', { method: 'GET' });
        return res.ok;
      } catch (err) {
        return false;
      }
    }
  };
})(window);
