import { reactive } from 'vue';
const stored = localStorage.getItem('user');
export const authState = reactive({ user: stored ? JSON.parse(stored) : null });

export function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  authState.user = user;
}
export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  authState.user = null;
}
export function isLoggedIn() { return !!authState.user; }
export function hasRole(...roles) { return authState.user && roles.includes(authState.user.role); }
