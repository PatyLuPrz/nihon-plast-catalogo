<template>
  <div class="container py-4 minimal-bg">
    <!-- Navbar global ahora en App.vue -->
    <div class="row g-4">
      <div class="col-12 mx-auto">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fw-semibold mb-0">Lista de Proveedores</h3>
          <router-link :to="{ name: 'ProveedorNuevo' }" class="btn btn-success minimal-btn">+ Nuevo Proveedor</router-link>
        </div>
        <div v-if="loading" class="alert alert-info">Cargando proveedores...</div>
        <div v-else-if="error" class="alert alert-danger">Error al cargar: {{ error }}</div>
        <div class="table-responsive minimal-table-wrapper">
          <table class="table table-borderless align-middle minimal-table">
            <thead>
              <tr class="bg-light">
                <th>ID</th>
                <th>Nombre</th>
                <th>RFC</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="prov in proveedores" :key="prov.IdProveedor">
                <td class="text-muted">{{ prov.IdProveedor }}</td>
                <td class="fw-semibold">{{ prov.NomProveedor }}</td>
                <td>{{ prov.RFC }}</td>
                <td>
                  <router-link :to="{ name: 'ProveedorEditar', params: { id: prov.IdProveedor } }" class="btn btn-sm btn-info me-2 minimal-btn">Editar</router-link>
                  <button @click="confirmDelete(prov)" class="btn btn-sm btn-danger minimal-btn">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getProveedores, deleteProveedor } from '@/services/proveedorService';

const proveedores = ref([]);
const loading = ref(false);
const error = ref(null);
const router = useRouter();

const loadProveedores = async () => {
  loading.value = true;
  error.value = null;
  try {
    proveedores.value = await getProveedores();
  } catch (err) {
    error.value = 'Hubo un error al recuperar los proveedores.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadProveedores);

const confirmDelete = async (prov) => {
  if (confirm(`¿Está seguro de eliminar el proveedor: ${prov.NombreProveedor}?`)) {
    try {
      await deleteProveedor(prov.IdProveedor);
      alert(`Proveedor "${prov.NombreProveedor}" eliminado exitosamente.`);
      loadProveedores();
    } catch (error) {
      alert("Error al eliminar el proveedor: " + (error.response?.data?.msg || "Error desconocido."));
    }
  }
};
</script>

<style scoped>
.minimal-bg {
  background: #f8f9fa;
  min-height: 90vh;
}
.minimal-btn {
  border-radius: 0.5rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}
.minimal-table-wrapper {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.04);
  padding: 1rem;
}
.minimal-table th, .minimal-table td {
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
}
.minimal-table th {
  font-weight: 600;
  color: #333;
  background: #f4f4f4;
}
.minimal-table tr {
  border-bottom: 1px solid #f0f0f0;
}
@media (max-width: 991px) {
  .minimal-table-wrapper {
    padding: 0.5rem;
  }
}
</style>
