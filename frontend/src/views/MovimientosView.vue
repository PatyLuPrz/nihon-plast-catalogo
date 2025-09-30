<template>
  <div class="container-fluid py-4">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4 rounded shadow-sm">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">Inventario App</a>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <router-link :to="{ name: 'Articulos' }" class="nav-link">Artículos</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link :to="{ name: 'Movimientos' }" class="nav-link active">Movimientos</router-link>
                    </li>
                    <li class="nav-item">
                        <button @click="handleLogout" class="btn btn-danger btn-sm ms-3">
                            Salir
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    
    <h1 class="mb-4">Registro de Movimientos de Stock</h1>

    <div class="card p-4 mb-4 shadow-sm">
      <h4 class="card-title">Nuevo Movimiento</h4>
      
      <div v-if="movimientoMsg" class="alert alert-success mt-3">{{ movimientoMsg }}</div>
      <div v-if="movimientoError" class="alert alert-danger mt-3">{{ movimientoError }}</div>

      <form @submit.prevent="handleMovimiento" class="row g-3">
        
        <div class="col-md-6">
          <label for="articulo" class="form-label">Artículo</label>
          <select id="articulo" v-model.number="form.IdArticulo" class="form-select" required>
            <option value="" disabled>Seleccione un artículo...</option>
            <option v-for="articulo in articulos" :key="articulo.IdArticulo" :value="articulo.IdArticulo">
                {{ articulo.NomArticulo }} (Stock: {{ articulo.StockActual }})
            </option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="tipo" class="form-label">Tipo</label>
          <select id="tipo" v-model="form.TipoMovimiento" class="form-select" required>
            <option value="" disabled>Seleccione tipo...</option>
            <option value="ENTRADA">ENTRADA (+)</option>
            <option value="SALIDA">SALIDA (-)</option>
          </select>
        </div>

        <div class="col-md-3">
          <label for="cantidad" class="form-label">Cantidad</label>
          <input type="number" id="cantidad" v-model.number="form.Cantidad" class="form-control" required min="1">
        </div>
        
        <div class="col-12">
            <label for="comentarios" class="form-label">Comentarios</label>
            <textarea id="comentarios" v-model="form.Comentarios" class="form-control" rows="2"></textarea>
        </div>

        <div class="col-12 mt-4">
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <span v-if="isSaving">Registrando...</span>
            <span v-else>Registrar Movimiento</span>
          </button>
        </div>
      </form>
    </div>

    <h3 class="mt-5 mb-3">Historial de Movimientos</h3>
    
    <div v-if="loadingHistorial" class="alert alert-info">Cargando historial...</div>
    <div v-else-if="historialError" class="alert alert-danger">Error al cargar historial: {{ historialError }}</div>
    
    <div v-else-if="historial.length === 0" class="alert alert-warning text-center">
        Historial vacío. ¡Registra una **Entrada** o **Salida** para empezar! 🚚
    </div>
    
    <div v-else class="table-responsive">
        <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
                <tr>
                    <th>ID Mov.</th>
                    <th>Artículo</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Final</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="mov in historial" :key="mov.IdMovimiento" 
                    :class="{'table-success': mov.TipoMovimiento === 'ENTRADA', 'table-danger': mov.TipoMovimiento === 'SALIDA'}">
                    <td>{{ mov.IdMovimiento }}</td>
                    <td>{{ mov.NomArticulo }}</td>
                    <td>
                        <span class="badge" :class="{'bg-success': mov.TipoMovimiento === 'ENTRADA', 'bg-danger': mov.TipoMovimiento === 'SALIDA'}">
                            {{ mov.TipoMovimiento }}
                        </span>
                    </td>
                    <td>{{ mov.CantidadMovida }}</td>
                    <td>{{ mov.StockFinal }}</td>
                    <td>{{ new Date(mov.FechaMovimiento).toLocaleDateString() }} {{ new Date(mov.FechaMovimiento).toLocaleTimeString() }}</td>
                </tr>
            </tbody>
            <tfoot class="table-light">
                <tr>
                    <td colspan="6">Total de registros: {{ historial.length }}</td>
                </tr>
            </tfoot>
        </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import articuloService from '@/services/articuloService';

const router = useRouter();
const authStore = useAuthStore();

// Datos del Formulario
const form = reactive({
    IdArticulo: '',
    Cantidad: 1, 
    TipoMovimiento: '',
    Comentarios: ''
});

// Estado de la UI
const articulos = ref([]); 
const historial = ref([]);
const isSaving = ref(false);
const loadingHistorial = ref(false);
const movimientoMsg = ref(null);
const movimientoError = ref(null);
const historialError = ref(null);

// Lógica de Carga de Artículos y Historial
const loadData = async () => {
    loadingHistorial.value = true;
    historialError.value = null;
    historial.value = []; 

    try {
        // 1. Cargar Artículos (para el dropdown del formulario)
        articulos.value = await articuloService.getArticulos(); 
        
        // 2. Cargar Historial de Movimientos
        try {
            const movimientos = await articuloService.getMovimientos();
            historial.value = movimientos;
        } catch (err) {
            console.warn("Error al cargar historial, posible tabla vacía.", err.response?.status);
            historial.value = []; 
        }


    } catch (err) {
        historialError.value = "Error al cargar los datos necesarios. (Verifique sesión y Backend)";
        console.error("Error loading data:", err);
    } finally {
        loadingHistorial.value = false;
    }
};

// Manejo del Formulario de Movimiento
const handleMovimiento = async () => {
    isSaving.value = true;
    movimientoMsg.value = null;
    movimientoError.value = null;

    try {
        if (form.Cantidad <= 0) {
            throw new Error("La cantidad debe ser mayor a cero.");
        }
        
        // CONSTRUIMOS EL PAYLOAD COMPLETO
        const payload = {
            IdArticulo: form.IdArticulo,
            Cantidad: form.Cantidad, 
            TipoMovimiento: form.TipoMovimiento,
            Comentarios: form.Comentarios || `Movimiento ${form.TipoMovimiento}`,
        };

        await articuloService.registrarMovimiento(payload);

        movimientoMsg.value = `${form.TipoMovimiento} de ${form.Cantidad} unidades registrada con éxito.`;
        
        // Limpiar formulario y recargar datos
        form.IdArticulo = '';
        form.Cantidad = 1; 
        form.TipoMovimiento = '';
        form.Comentarios = ''; 
        
        loadData(); 

    } catch (err) {
        movimientoError.value = err.response?.data?.msg || 'Error al registrar el movimiento.';
        console.error("Error en movimiento:", err);
    } finally {
        isSaving.value = false;
    }
};

// Función para manejar el cierre de sesión
const handleLogout = () => {
    authStore.logout();
    router.push({ name: 'Login' });
};

onMounted(loadData);
</script>