<template>
  <div class="container-fluid py-4">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4 rounded shadow-sm">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">Inventario App</a>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <router-link :to="{ name: 'Articulos' }" class="nav-link active">Artículos</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link :to="{ name: 'Movimientos' }" class="nav-link">Movimientos</router-link>
                    </li>
                    <li class="nav-item">
                        <button @click="handleLogout" class="btn btn-danger btn-sm ms-3">
                            Salir ({{ authStore.user.NombreUsuario }})
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    
    <h1 class="mb-4">Catálogo de Artículos</h1>

    <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>Lista de Inventario (Stock: {{ totalStock }})</h3>
        <router-link :to="{ name: 'ArticuloNuevo' }" class="btn btn-success">
            + Nuevo Artículo
        </router-link>
    </div>

    <div v-if="loading" class="alert alert-info">Cargando artículos...</div>
    <div v-else-if="error" class="alert alert-danger">Error al cargar: {{ error }}</div>

    <div class="table-responsive">
        <table class="table table-striped table-hover shadow-sm">
            <thead class="table-dark">
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Stock Actual</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                    <th>Unidad</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="articulo in articulos" :key="articulo.IdArticulo" 
                    :class="{'table-warning': articulo.StockActual <= articulo.CantidadMinima}">
                    
                    <td>{{ articulo.IdArticulo }}</td>
                    <td>
                        {{ articulo.NomArticulo }}
                        <span v-if="articulo.StockActual <= articulo.CantidadMinima" class="badge bg-danger ms-2">Bajo Stock</span>
                    </td>
                    <td>
                        <strong>{{ articulo.StockActual }}</strong>
                    </td>
                    <td>{{ articulo.CantidadMinima }}</td>
                    <td>{{ articulo.CantidadMaxima }}</td>
                    <td>{{ articulo.NombreUnidad }}</td>
                    <td>
                        <router-link :to="{ name: 'ArticuloEditar', params: { id: articulo.IdArticulo } }" 
                                     class="btn btn-sm btn-info me-2">
                            Editar
                        </router-link>
                        <button @click="confirmDelete(articulo)" class="btn btn-sm btn-danger">
                            Eliminar
                        </button>
                    </td>
                </tr>
            </tbody>
            <tfoot class="table-light">
                <tr>
                    <td colspan="2" class="text-end">**Total de Unidades en Stock:**</td>
                    <td colspan="5"><strong>{{ totalStock }}</strong></td>
                </tr>
            </tfoot>
        </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import articuloService from '@/services/articuloService'; // Importamos el nuevo servicio

const articulos = ref([]);
const loading = ref(false);
const error = ref(null);
const authStore = useAuthStore();
const router = useRouter();

// Propiedad computada para calcular el total de stock
const totalStock = computed(() => {
    return articulos.value.reduce((sum, item) => sum + item.StockActual, 0);
});

// Función para cargar los datos desde el Backend
const loadArticulos = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Llama al servicio que a su vez llama a la API protegida
        articulos.value = await articuloService.getArticulos();
    } catch (err) {
        if (err.response?.status === 401) {
             // El servicio ya maneja el logout, solo mostramos el error
             error.value = "Sesión expirada. Por favor, inicie sesión de nuevo.";
        } else {
            error.value = "Hubo un error al recuperar los datos del catálogo.";
        }
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Llama a la función de carga al montar el componente
onMounted(loadArticulos);

// Función para manejar el cierre de sesión
const handleLogout = () => {
    authStore.logout();
    router.push({ name: 'Login' });
};

const confirmDelete = async (articulo) => {
    if (confirm(`¿Está seguro de eliminar (baja lógica) el artículo: ${articulo.NomArticulo}?`)) {
        try {
            // Lógica de eliminación (baja lógica)
            await articuloService.deleteArticulo(articulo.IdArticulo);
            alert(`Artículo "${articulo.NomArticulo}" eliminado (baja lógica) exitosamente.`);
            
            // Recargar la lista para que el artículo desaparecido se refleje
            loadArticulos(); 
        } catch (error) {
            alert("Error al eliminar el artículo: " + (error.response?.data?.msg || "Error desconocido."));
        }
    }
};
</script>