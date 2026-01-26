import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1', // Should be configurable via env vars ideally
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export interface Tenant {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    // Add other fields as per model
}

export const getTenants = async (): Promise<Tenant[]> => {
    const response = await api.get<Tenant[]>('/tenants');
    return response.data;
};

export const createTenant = async (name: string): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', { name });
    return response.data;
};

export default api;
