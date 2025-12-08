import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Crear instancia de axios
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Flag para evitar múltiples renovaciones simultáneas
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
    refreshSubscribers.forEach(callback => callback(token));
};

const addRefreshSubscriber = (callback) => {
    refreshSubscribers.push(callback);
};

// Interceptor de respuesta
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si error es 401 (token expirado) y no es una petición de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Si ya se está renovando, esperar a que termine
                return new Promise((resolve) => {
                    addRefreshSubscriber((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;
            refreshSubscribers = [];

            try {
                // Intentar renovar el token
                const response = await axios.post(
                    'http://localhost:3000/api/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                const newToken = response.data.access_token;
                localStorage.setItem('access_token', newToken);

                // Actualizar header de la petición original
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

                // Notificar a las otras peticiones que esperaban
                onRefreshed(newToken);
                isRefreshing = false;

                // Reintentar la petición original
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('[axios] Error renovando token:', refreshError.message);
                isRefreshing = false;

                // Token no se pudo renovar, limpiar y redirigir a login
                localStorage.removeItem('access_token');
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Interceptor de solicitud para agregar token automáticamente
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
