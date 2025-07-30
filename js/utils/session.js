// js/utils/session.js
const TOKEN_KEY = 'authToken';

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeader() {
  const token = getToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}