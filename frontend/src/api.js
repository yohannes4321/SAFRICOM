const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/tasks`;
export async function request(path = '', options = {}) {
  let response;
  try {
    response = await fetch(BASE + path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  } catch { throw new Error('Cannot connect to the API. Check that the backend is running on port 8080.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}
