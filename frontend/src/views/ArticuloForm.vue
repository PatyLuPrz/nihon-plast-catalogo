<template>
    <div class="container py-4 minimal-bg">
        <div class="row g-4">
            <div class="col-12 col-lg-7 mx-auto">
                <h1 class="mb-4 fw-semibold text-center">{{ isEditing ? 'Editar Artículo' : 'Crear Nuevo Artículo' }}</h1>
                <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
                <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
                <div v-if="loading" class="alert alert-info">Cargando datos...</div>
                <div class="card border-0 shadow-sm minimal-card" :class="{ 'opacity-50': isSaving || loading }">
                    <div class="card-body">
                        <form @submit.prevent="handleSubmit" class="row g-3">
                            <div v-if="isEditing" class="col-12">
                                <label class="form-label">ID Artículo</label>
                                <input type="text" :value="form.IdArticulo" class="form-control minimal-input" disabled>
                            </div>
                            <div class="col-12 col-md-6">
                                <label for="codigo" class="form-label">Código del Artículo</label>
                                <input type="text" id="codigo" v-model="form.CodArticulo" class="form-control minimal-input" required>
                            </div>
                            <div class="col-12 col-md-6">
                                <label for="nombre" class="form-label">Nombre del Artículo</label>
                                <input type="text" id="nombre" v-model="form.NomArticulo" class="form-control minimal-input" required>
                            </div>
                            <div class="col-12 col-md-6">
                                <label for="proveedor" class="form-label">Proveedor</label>
                                <select id="proveedor" v-model="form.IdProveedor" class="form-select minimal-input" required>
                                    <option value="" disabled>Selecciona un proveedor</option>
                                    <option v-for="prov in proveedores" :key="prov.IdProveedor" :value="prov.IdProveedor">
                                        {{ prov.NomProveedor }} ({{ prov.RFC }})
                                    </option>
                                </select>
                            </div>
                            <div class="col-12 col-md-6">
                                <label for="unidad" class="form-label">Unidad de Medida (Nombre)</label>
                                <input type="text" id="unidad" v-model="form.NombreUnidad" class="form-control minimal-input" required>
                            </div>
                            <div class="col-12 col-md-6">
                                <label for="minimo" class="form-label">Stock Mínimo (Alerta)</label>
                                <input type="number" id="minimo" v-model.number="form.CantidadMinima" class="form-control minimal-input" required min="0">
                            </div>
                            <div class="col-12 col-md-6">
                                <label for="maximo" class="form-label">Stock Máximo (Límite)</label>
                                <input type="number" id="maximo" v-model.number="form.CantidadMaxima" class="form-control minimal-input" required min="0">
                            </div>
                            <div class="col-12 d-flex justify-content-between mt-4">
                                <button type="button" @click="$router.push({ name: 'Articulos' })" class="btn btn-secondary minimal-btn">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-dark minimal-btn" :disabled="isSaving">
                                    <span v-if="isSaving">Guardando...</span>
                                    <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Artículo' }}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import articuloService from '@/services/articuloService';
import { getProveedores } from '@/services/proveedorService';

const route = useRoute();
const router = useRouter();

const isEditing = computed(() => !!route.params.id);
const itemId = computed(() => route.params.id);

const form = reactive({
    // Propiedades del Artículo
    IdArticulo: null,
    NomArticulo: '', 
    CodArticulo: '', 
    StockActual: 0, 
    IdProveedor: '',      
    CantidadMinima: 0,
    CantidadMaxima: 0,
    NombreUnidad: '', 
});

const proveedores = ref([]);

const loading = ref(false);
const isSaving = ref(false);
const errorMsg = ref(null);
const successMsg = ref(null);

// Lógica de carga para modo Edición
const loadItem = async () => {
    loading.value = true;
    errorMsg.value = null;
    try {
        const item = await articuloService.getArticuloById(itemId.value);
        
        // Mapear los datos de la respuesta al formulario
        form.IdArticulo = item.IdArticulo;
        form.NomArticulo = item.NomArticulo;
        form.StockActual = item.StockActual;
        
        // Cargar los campos nuevos
        form.CodArticulo = item.CodArticulo;
        form.IdProveedor = item.IdProveedor;

        // Asignar los límites de CfgStock
        form.CantidadMinima = item.CantidadMinima;
        form.CantidadMaxima = item.CantidadMaxima;
        form.NombreUnidad = item.NombreUnidad;
        
    } catch (err) {
        errorMsg.value = "Error al cargar el artículo. Puede que no exista o que la sesión haya expirado.";
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Lógica de envío del formulario
const handleSubmit = async () => {
    isSaving.value = true;
    errorMsg.value = null;
    successMsg.value = null;

    try {
        let response;
        const dataToSend = {
            NomArticulo: form.NomArticulo,
            
            // CAMPOS ENVIADOS AL BACKEND
            CodArticulo: form.CodArticulo, 
            IdProveedor: form.IdProveedor,
            
            CantidadMinima: form.CantidadMinima,
            CantidadMaxima: form.CantidadMaxima,
            NombreUnidad: form.NombreUnidad
        };

        if (isEditing.value) {
            // Modo Edición (PUT)
            response = await articuloService.updateArticulo(itemId.value, dataToSend);
            successMsg.value = `Artículo actualizado exitosamente.`;
            
            // Pequeña espera para mostrar el mensaje y recargar los datos
            setTimeout(loadItem, 1000); 

        } else {
            // Modo Creación (POST)
            response = await articuloService.createArticulo(dataToSend);
            successMsg.value = `Artículo creado con ID ${response.IdArticulo}.`;
            
            // Redirigir a la lista de artículos
            setTimeout(() => {
                router.push({ name: 'Articulos' });
            }, 1500);
        }

    } catch (err) {
        // Mostrar mensaje de error del backend si existe (ej. validaciones)
        errorMsg.value = err.response?.data?.msg || 'Error desconocido al procesar la solicitud.';
        console.error("Error en el formulario:", err);
    } finally {
        isSaving.value = false;
    }
};

// Cargar proveedores y datos al montar
onMounted(async () => {
    try {
        proveedores.value = await getProveedores();
    } catch (err) {
        errorMsg.value = 'Error al cargar proveedores.';
    }
    if (isEditing.value) {
        loadItem();
    }
});
</script>

<style scoped>
/* Estilos locales para deshabilitar mientras guarda */
.opacity-50 {
    opacity: 0.5;
    pointer-events: none;
}
</style>