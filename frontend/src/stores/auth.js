import { defineStore } from 'pinia';
import axios from 'axios';

// URL base de tu backend (¡ajusta el puerto si es necesario!)
const API_URL = 'http://localhost:3001/api'; 

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  }),
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        
        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;

        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));

        this.loading = false;
        return true; 
      } catch (err) {
        this.error = err.response?.data?.msg || 'Error de conexión o credenciales inválidas.';
        this.loading = false;
        return false;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});