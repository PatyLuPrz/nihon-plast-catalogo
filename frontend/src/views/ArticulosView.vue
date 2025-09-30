<template>
    <div class="container py-4 minimal-bg">
        <!-- Navbar global ahora en App.vue -->

        <div class="row g-4">
            <div class="col-12 mx-auto">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="fw-semibold">Lista de Inventario <span class="text-muted">(Stock: {{ totalStock }})</span></h3>
                    <router-link :to="{ name: 'ArticuloNuevo' }" class="btn btn-success minimal-btn">
                        + Nuevo Artículo
                    </router-link>
                </div>
                <div v-if="loading" class="alert alert-info">Cargando artículos...</div>
                <div v-else-if="error" class="alert alert-danger">Error al cargar: {{ error }}</div>
                <div class="table-responsive minimal-table-wrapper">
                    <table class="table table-borderless align-middle minimal-table">
                        <thead>
                            <tr class="bg-light">
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
                            <tr v-for="articulo in articulos" :key="articulo.IdArticulo" :class="{'table-warning': articulo.StockActual <= articulo.CantidadMinima}">
                                <td class="text-muted">{{ articulo.IdArticulo }}</td>
                                <td class="fw-semibold">
                                    {{ articulo.NomArticulo }}
                                    <span v-if="articulo.StockActual <= articulo.CantidadMinima" class="badge bg-danger ms-2">Bajo Stock</span>
                                </td>
                                <td><strong>{{ articulo.StockActual }}</strong></td>
                                <td>{{ articulo.CantidadMinima }}</td>
                                <td>{{ articulo.CantidadMaxima }}</td>
                                <td>{{ articulo.NombreUnidad }}</td>
                                <td>
                                    <router-link :to="{ name: 'ArticuloEditar', params: { id: articulo.IdArticulo } }" class="btn btn-sm btn-info me-2 minimal-btn">Editar</router-link>
                                    <button @click="confirmDelete(articulo)" class="btn btn-sm btn-danger minimal-btn">Eliminar</button>
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" class="text-end">Total de Unidades en Stock:</td>
                                <td colspan="5"><strong>{{ totalStock }}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
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