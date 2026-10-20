import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../services/auth';

import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ApproveRegistration from '../views/ApproveRegistration.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import ResetPassword from '../views/ResetPassword.vue';
import Home from '../views/Home.vue';
import Landing from '../views/Landing.vue';
import Assets from '../views/Assets.vue';
import AssetDetails from '../views/AssetDetails.vue';
import MyBorrows from '../views/MyBorrows.vue';
import Approvals from '../views/Approvals.vue';
import AdminAssets from '../views/admin/AdminAssets.vue';
import AdminReturns from '../views/admin/AdminReturns.vue';
import AdminEmployees from '../views/admin/AdminEmployees.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminFines from '../views/admin/AdminFines.vue';
import AdminRepairs from '../views/admin/AdminRepairs.vue';
import MyFines from '../views/MyFines.vue';
import Contact from '../views/Contact.vue';
import Profile from '../views/Profile.vue';
import ConfirmEmailChange from '../views/ConfirmEmailChange.vue';
import ConfirmPasswordChange from '../views/ConfirmPasswordChange.vue';
import AdminReports from '../views/admin/AdminReports.vue';
import AdminReservations from '../views/admin/AdminReservations.vue';
import AdminActivityLogs from '../views/admin/AdminActivityLogs.vue';
import AdminOrganization from '../views/admin/AdminOrganization.vue';

const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword },
  { path: '/confirm-email-change', component: ConfirmEmailChange },
  { path: '/confirm-password-change', component: ConfirmPasswordChange },
  { path: '/approve-registration', component: ApproveRegistration, meta: { requiresRole: ['admin'] } },
  { path: '/', component: Landing },
  { path: '/assets', component: Assets, meta: { requiresAuth: true } },
  { path: '/assets/:id', component: AssetDetails, meta: { requiresAuth: true } },
  { path: '/my-borrows', component: MyBorrows, meta: { requiresAuth: true } },
  { path: '/my-fines', component: MyFines, meta: { requiresAuth: true } },
  { path: '/approvals', component: Approvals, meta: { requiresRole: ['approver', 'admin'] } },
  { path: '/admin/assets', component: AdminAssets, meta: { requiresRole: ['admin'] } },
  { path: '/admin/returns', component: AdminReturns, meta: { requiresRole: ['admin', 'approver'] } },
  { path: '/admin/reservations', component: AdminReservations, meta: { requiresRole: ['admin'] } },
  { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresRole: ['admin'] } },
  { path: '/admin/activity-logs', component: AdminActivityLogs, meta: { requiresRole: ['admin'] } },
  { path: '/admin/organization', component: AdminOrganization, meta: { requiresRole: ['admin'] } },
  { path: '/admin/fines', component: AdminFines, meta: { requiresRole: ['admin'] } },
  { path: '/admin/repairs', component: AdminRepairs, meta: { requiresRole: ['admin', 'approver'] } },
  { path: '/admin/employees', component: AdminEmployees, meta: { requiresRole: ['admin'] } },
  { path: '/contact', component: Contact, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin/reports', component: AdminReports, meta: { requiresRole: ['admin'] }
}
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
