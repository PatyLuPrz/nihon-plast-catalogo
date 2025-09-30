<template>
  <!-- Navbar global ahora en App.vue -->
  <div class="container py-4 minimal-bg d-flex align-items-center justify-content-center" style="min-height: 80vh;">
    <div class="col-12 col-md-6 col-lg-4 mx-auto">
      <div class="card border-0 shadow-sm minimal-card">
        <div class="card-body">
          <h4 class="card-title mb-3 fw-semibold text-center">Iniciar Sesión</h4>
          <div v-if="authStore.error" class="alert alert-danger" role="alert">
            {{ authStore.error }}
          </div>
          <form @submit.prevent="handleLogin" class="row g-3">
            <div class="col-12">
              <label for="email" class="form-label">Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                v-model="email"
                class="form-control form-control-lg minimal-input"
              >
            </div>
            <div class="col-12">
              <label for="password" class="form-label">Contraseña</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                v-model="password"
                class="form-control form-control-lg minimal-input"
              >
            </div>
            <div class="col-12 d-grid mt-2">
              <button 
                type="submit" 
                :disabled="authStore.loading"
                class="btn btn-dark btn-lg minimal-btn"
              >
                <span v-if="authStore.loading">Cargando...</span>
                <span v-else>Iniciar Sesión</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; 

const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  const success = await authStore.login(email.value, password.value);
  
  if (success) {
    router.push({ name: 'Articulos' });
  }
};
</script>