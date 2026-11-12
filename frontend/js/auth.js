import { api, setToken } from './api.js';
for (const form of document.querySelectorAll('form')) form.addEventListener('submit', async event => {
  event.preventDefault(); const button = form.querySelector('button'); const error = form.querySelector('.form-error'); error.hidden = true;
  const values = Object.fromEntries(new FormData(form)); const isRegister = form.id === 'register-form';
  if (isRegister && values.password !== values.confirmPassword) { error.textContent = 'Passwords do not match.'; error.hidden = false; return; }
  if (new TextEncoder().encode(values.password).length > 72) { error.textContent = 'Password must be 72 UTF-8 bytes or fewer.'; error.hidden = false; return; }
  delete values.confirmPassword; button.disabled = true; const original = button.innerHTML; button.textContent = isRegister ? 'Creating account…' : 'Logging in…';
  try { if (isRegister) { await api('/auth/register', { method:'POST', body:values, auth:false }); location.href = 'login.html?registered=1'; }
    else { const result = await api('/auth/login', { method:'POST', body:values, auth:false }); setToken(result.token); location.href = 'dashboard.html'; }
  } catch (err) { error.textContent = err.message; error.hidden = false; } finally { button.disabled = false; button.innerHTML = original; }
});
if (new URLSearchParams(location.search).has('registered')) { const p=document.querySelector('.auth-form-wrap > .muted'); if(p) p.textContent='Account created! Log in to continue.'; }
