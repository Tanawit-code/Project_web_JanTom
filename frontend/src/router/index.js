import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../services/auth';

import Login from '../views/Login.vue';
import Home from '../views/Home.vue';
import Assets from '../views/Assets.vue';
import MyBorrows from '../views/MyBorrows.vue';
import Approvals from '../views/Approvals.vue';
import AdminAssets from '../views/admin/AdminAssets.vue';
import AdminReturns from '../views/admin/AdminReturns.vue';
import AdminEmployees from '../views/admin/AdminEmployees.vue';
import Contact from '../views/Contact.vue';

const routes = [
  { path: '/login', component: Login },
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/assets', component: Assets, meta: { requiresAuth: true } },
  { path: '/my-borrows', component: MyBorrows, meta: { requiresAuth: true } },
  { path: '/approvals', component: Approvals, meta: { requiresRole: ['approver', 'admin'] } },
  { path: '/admin/assets', component: AdminAssets, meta: { requiresRole: ['admin'] } },
  { path: '/admin/returns', component: AdminReturns, meta: { requiresRole: ['admin', 'approver'] } },
  { path: '/admin/employees', component: AdminEmployees, meta: { requiresRole: ['admin'] } },
  { path: '/contact', component: Contact, meta: { requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authState.user) return '/login';
  if (to.meta.requiresRole && !to.meta.requiresRole.includes(authState.user?.role)) return '/';
  return true;
});

export default router;
