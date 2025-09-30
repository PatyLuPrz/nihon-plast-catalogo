<template>
  <div class="d-flex align-items-center justify-content-center" style="min-height: 100vh; background-color: #f8f9fa;">
    <div class="card p-4 shadow-lg" style="width: 100%; max-width: 400px;">
      <h2 class="card-title text-center mb-4">
        Iniciar Sesión
      </h2>

      <div v-if="authStore.error" class="alert alert-danger" role="alert">
        {{ authStore.error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            v-model="email"
            class="form-control"
          >
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Contraseña</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            v-model="password"
            class="form-control"
          >
        </div>

        <button 
          type="submit" 
          :disabled="authStore.loading"
          class="btn btn-primary w-100 mt-3"
        >
          <span v-if="authStore.loading">Cargando...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>
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