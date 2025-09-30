<template>
  <div class="container py-4 minimal-bg d-flex align-items-center justify-content-center" style="min-height: 60vh;">
    <div class="col-12 col-md-6 col-lg-4 mx-auto">
      <div class="card border-0 shadow-sm minimal-card">
        <div class="card-body">
          <h4 class="card-title mb-3 fw-semibold text-center">{{ isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h4>
          <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
          <form @submit.prevent="handleSubmit" class="row g-3">
            <div class="col-12">
              <label for="nombre" class="form-label">Nombre del Proveedor</label>
              <input type="text" id="nombre" v-model="form.NomProveedor" class="form-control form-control-lg minimal-input" required>
            </div>
            <div class="col-12">
              <label for="rfc" class="form-label">RFC</label>
              <input type="text" id="rfc" v-model="form.RFC" class="form-control form-control-lg minimal-input" required>
            </div>
            <div class="col-12 d-grid mt-2">
              <button type="submit" class="btn btn-dark btn-lg minimal-btn" :disabled="isSaving">
                <span v-if="isSaving">Guardando...</span>
                <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Proveedor' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, reactive, computed, onMounted } from 'vue';
import { getProveedores, createProveedor, updateProveedor } from '@/services/proveedorService';

const route = useRoute();
const router = useRouter();
const isEditing = computed(() => !!route.params.id);
const itemId = computed(() => route.params.id);

const form = reactive({
  NomProveedor: '',
  RFC: ''
});
const isSaving = ref(false);
const errorMsg = ref(null);

onMounted(async () => {
  if (isEditing.value) {
    try {
      const proveedores = await getProveedores();
      const proveedor = proveedores.find(p => p.IdProveedor == itemId.value);
      if (proveedor) {
        form.NomProveedor = proveedor.NomProveedor;
        form.RFC = proveedor.RFC;
      }
    } catch (err) {
      errorMsg.value = 'Error al cargar proveedor.';
    }
  }
});

const handleSubmit = async () => {
  isSaving.value = true;
  errorMsg.value = null;
  try {
    if (isEditing.value) {
      await updateProveedor(itemId.value, { NomProveedor: form.NomProveedor, RFC: form.RFC });
      router.push({ name: 'Proveedores' });
    } else {
      await createProveedor({ NomProveedor: form.NomProveedor, RFC: form.RFC });
      router.push({ name: 'Proveedores' });
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.msg || 'Error al guardar proveedor.';
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.minimal-bg {
  background: #f8f9fa;
  min-height: 80vh;
}
.minimal-card {
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 2px 16px rgba(0,0,0,0.04);
}
.minimal-input {
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  font-size: 1.1rem;
}
.minimal-btn {
  border-radius: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}
@media (max-width: 991px) {
  .minimal-card {
    margin-bottom: 2rem;
  }
}
</style>
