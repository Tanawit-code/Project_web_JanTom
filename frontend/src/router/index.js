import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../services/auth';

import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ApproveRegistration from '../views/ApproveRegistration.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import ResetPassword from '../views/ResetPassword.vue';
import Home from '../views/Home.vue';
import Assets from '../views/Assets.vue';
import MyBorrows from '../views/MyBorrows.vue';
import Approvals from '../views/Approvals.vue';
import AdminAssets from '../views/admin/AdminAssets.vue';
import AdminReturns from '../views/admin/AdminReturns.vue';
import AdminEmployees from '../views/admin/AdminEmployees.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminFines from '../views/admin/AdminFines.vue';
import MyFines from '../views/MyFines.vue';
import Contact from '../views/Contact.vue';

const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword },
  { path: '/approve-registration', component: ApproveRegistration, meta: { requiresRole: ['admin'] } },
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/assets', component: Assets, meta: { requiresAuth: true } },
  { path: '/my-borrows', component: MyBorrows, meta: { requiresAuth: true } },
  { path: '/my-fines', component: MyFines, meta: { requiresAuth: true } },
  { path: '/approvals', component: Approvals, meta: { requiresRole: ['approver', 'admin'] } },
  { path: '/admin/assets', component: AdminAssets, meta: { requiresRole: ['admin'] } },
  { path: '/admin/returns', component: AdminReturns, meta: { requiresRole: ['admin', 'approver'] } },
  { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresRole: ['admin'] } },
  { path: '/admin/fines', component: AdminFines, meta: { requiresRole: ['admin'] } },
  { path: '/admin/employees', component: AdminEmployees, meta: { requiresRole: ['admin'] } },
  { path: '/contact', component: Contact, meta: { requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  if ((to.meta.requiresAuth || to.meta.requiresRole) && !authState.user) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresRole && !to.meta.requiresRole.includes(authState.user?.role)) return '/';
  // admin เข้าหน้าแรกแล้วไปที่แดชบอร์ดเลย
  if (to.path === '/' && authState.user?.role === 'admin') return '/admin/dashboard';
  return true;
});

export default router;
