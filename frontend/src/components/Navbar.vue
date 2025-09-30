<template>
  <nav class="navbar navbar-light bg-white border-bottom mb-4 px-0 px-md-2 minimal-card">
    <div class="container-fluid d-flex justify-content-between align-items-center">
      <span class="navbar-brand fw-bold fs-3 text-dark">Catálogo Inventario</span>
      <div v-if="authStore.isAuthenticated">
        <router-link to="/articulos" class="btn btn-link minimal-btn me-2">Artículos</router-link>
        <router-link to="/movimientos" class="btn btn-link minimal-btn me-2">Movimientos</router-link>
        <router-link to="/proveedores" class="btn btn-link minimal-btn me-2">Proveedores</router-link>
        <button @click="handleLogout" class="btn btn-link minimal-btn">Salir ({{ authStore.user?.NombreUsuario || 'Usuario' }})</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.btn-link.minimal-btn {
  color: #213547;
  font-weight: 500;
  text-decoration: none;
  padding: 0.5em 1em;
  border-radius: 0.5rem;
  transition: background 0.2s;
}
.btn-link.minimal-btn:hover {
  background: #f8f9fa;
  color: #646cff;
}
</style>
