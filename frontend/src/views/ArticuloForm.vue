<template>
    <div class="container py-4">
        <h1 class="mb-4">{{ isEditing ? 'Editar Artículo' : 'Crear Nuevo Artículo' }}</h1>

        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
        <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div v-if="loading" class="alert alert-info">Cargando datos...</div>
        
        <div class="card p-4 shadow-sm" :class="{ 'opacity-50': isSaving || loading }">
            <form @submit.prevent="handleSubmit">
                
                <div v-if="isEditing" class="mb-3">
                    <label class="form-label">ID Artículo</label>
                    <input type="text" :value="form.IdArticulo" class="form-control" disabled>
                </div>

                <div class="mb-3">
                    <label for="codigo" class="form-label">Código del Artículo</label>
                    <input type="text" id="codigo" v-model="form.CodArticulo" class="form-control" required>
                </div>

                <div class="mb-3">
                    <label for="nombre" class="form-label">Nombre del Artículo</label>
                    <input type="text" id="nombre" v-model="form.NomArticulo" class="form-control" required>
                </div>
                
                <div class="mb-3">
                    <label for="proveedor" class="form-label">ID Proveedor</label>
                    <input type="number" id="proveedor" v-model.number="form.IdProveedor" class="form-control" required min="1">
                    <small class="form-text text-muted">Asegúrate de que este ID exista en tu tabla de Proveedores.</small>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="minimo" class="form-label">Stock Mínimo (Alerta)</label>
                        <input type="number" id="minimo" v-model.number="form.CantidadMinima" class="form-control" required min="0">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="maximo" class="form-label">Stock Máximo (Límite)</label>
                        <input type="number" id="maximo" v-model.number="form.CantidadMaxima" class="form-control" required min="0">
                    </div>
                </div>

                <div class="mb-3">
                    <label for="unidad" class="form-label">Unidad de Medida (Nombre)</label>
                    <input type="text" id="unidad" v-model="form.NombreUnidad" class="form-control" required>
                </div>

                <div class="d-flex justify-content-between mt-4">
                    <button type="button" @click="$router.push({ name: 'Articulos' })" class="btn btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                        <span v-if="isSaving">Guardando...</span>
                        <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Artículo' }}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import articuloService from '@/services/articuloService';

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
    IdProveedor: 1,      
    CantidadMinima: 0,
    CantidadMaxima: 0,
    NombreUnidad: '', 
});

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

// Cargar datos al montar si estamos en modo edición
onMounted(() => {
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