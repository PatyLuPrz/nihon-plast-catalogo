import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import LoginView from '@/views/LoginView.vue';
import ArticulosView from '@/views/ArticulosView.vue';
import ArticuloForm from '@/views/ArticuloForm.vue';
import MovimientosView from '@/views/MovimientosView.vue';
import ProveedoresView from '@/views/ProveedoresView.vue';
import ProveedorForm from '@/views/ProveedorForm.vue';

const routes = [
  { path: '/', name: 'Articulos', component: ArticulosView, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/articulos/nuevo', name: 'ArticuloNuevo', component: ArticuloForm, meta: { requiresAuth: true } },
  { path: '/articulos/editar/:id', name: 'ArticuloEditar', component: ArticuloForm, meta: { requiresAuth: true } },
  { path: '/movimientos', name: 'Movimientos', component: MovimientosView, meta: { requiresAuth: true } },
  { path: '/proveedores', name: 'Proveedores', component: ProveedoresView, meta: { requiresAuth: true } },
  { path: '/proveedores/nuevo', name: 'ProveedorNuevo', component: ProveedorForm, meta: { requiresAuth: true } },
  { path: '/proveedores/editar/:id', name: 'ProveedorEditar', component: ProveedorForm, meta: { requiresAuth: true } },
  { path: '/:catchAll(.*)', redirect: '/' }, 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guarda de Navegación (Protección de Rutas)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Articulos' });
  } else {
    next(); 
  }
});

export default router;