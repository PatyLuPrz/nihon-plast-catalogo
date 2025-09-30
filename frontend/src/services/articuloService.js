// frontend/src/services/articuloService.js

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const API_URL = 'http://localhost:3001/api/articulos';
const MOVIMIENTOS_API_URL = 'http://localhost:3001/api/movimientos'; 

// Función auxiliar para obtener el token y configurar el header de autorización
const getAuthHeader = () => {
    const authStore = useAuthStore();
    return {
        headers: {
            Authorization: `Bearer ${authStore.token}`
        }
    };
};

// ===========================================
// Lógica CRUD de Artículos
// ===========================================

/**
 * Obtiene la lista completa de artículos desde la API.
 * @returns {Promise<Array>} Lista de artículos.
 */
const getArticulos = async () => {
    try {
        const response = await axios.get(API_URL, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error("Error al obtener artículos:", error);
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            authStore.logout();
        }
        throw error;
    }
};

/**
 * Crea un nuevo artículo.
 */
const createArticulo = async (data) => {
    try {
        const response = await axios.post(API_URL, data, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error("Error al crear artículo:", error);
        throw error;
    }
};

/**
 * Obtiene un artículo por su ID (necesario para la edición).
 */
const getArticuloById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`Error al obtener artículo ${id}:`, error);
        throw error;
    }
};

/**
 * Actualiza un artículo existente.
 */
const updateArticulo = async (id, data) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar artículo ${id}:`, error);
        throw error;
    }
};

/**
 * Elimina un artículo por su ID (baja lógica).
 */
const deleteArticulo = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeader());
        return true;
    } catch (error) {
        console.error(`Error al eliminar artículo ${id}:`, error);
        throw error;
    }
};


// ===========================================
// Lógica de Movimientos
// ===========================================

/**
 * Registra un movimiento de stock (entrada o salida) para un artículo.
 * NOTA: Usa TipoMovimiento para construir la URL, y solo envía IdArticulo, Cantidad y Comentarios en el body.
 */
const registrarMovimiento = async (data) => {
    // Separamos el tipo de movimiento del resto de la data (el body)
    const { TipoMovimiento, IdArticulo, Cantidad, Comentarios } = data;
    // Construimos la URL usando el tipo de movimiento (ej: /api/movimientos/entrada)
    const url = `${MOVIMIENTOS_API_URL}/${TipoMovimiento.toLowerCase()}`;
    try {
        // Enviamos SOLO los datos (IdArticulo, Cantidad, Comentarios)
        const response = await axios.post(url, { IdArticulo, Cantidad, Comentarios }, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error("Error al registrar movimiento:", error);
        throw error;
    }
};

/**
 * Obtiene el historial de movimientos de stock.
 * @returns {Promise<Array>} Lista de movimientos.
 */
const getMovimientos = async () => {
    try {
        const response = await axios.get(MOVIMIENTOS_API_URL, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error("Error al obtener movimientos:", error);
        throw error;
    }
};


// Exportar todas las funciones
const articuloService = {
    getArticulos,
    createArticulo,
    getArticuloById,
    updateArticulo,
    deleteArticulo,
    registrarMovimiento,
    getMovimientos,
};

export default articuloService;