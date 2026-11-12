const API_BASE = 'http://localhost:5000/api';
const TOKEN_KEY = 'spendwise_token';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = token => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);
export async function api(path, options = {}) {
  const { body, auth = true, raw = false, ...rest } = options;
  const headers = new Headers(rest.headers || {});
  if (auth && getToken()) headers.set('Authorization', `Bearer ${getToken()}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  let response;
  try { response = await fetch(API_BASE + path, { ...rest, headers, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new Error('Cannot reach the server. Check that the backend is running.'); }
  if (!response.ok) { const error = await response.json().catch(() => ({})); if (response.status === 401 && auth && error.message !== 'Current password is incorrect') { clearToken(); location.href = 'login.html'; throw new Error('Your session has expired.'); } throw new Error(error.message || 'Something went wrong. Please try again.'); }
  return raw ? response : response.json();
}
