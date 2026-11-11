import axios from 'axios';

let accessToken = null;
let refreshRequest = null;

export function setAccessToken(token) {
  accessToken = token;
}

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((request) => {
  if (accessToken) {
    request.headers.Authorization = `Bearer ${accessToken}`;
  }
  return request;
});

async function requestRefresh() {
  if (!refreshRequest) {
    refreshRequest = api.post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: data.user }));
        return data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

api.interceptors.response.use(undefined, async (error) => {
  const originalRequest = error.config;
  const authRoute = originalRequest?.url?.startsWith('/auth/');
  if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || authRoute) {
    return Promise.reject(error);
  }

  originalRequest._retried = true;
  try {
    await requestRefresh();
    return api(originalRequest);
  } catch {
    setAccessToken(null);
    window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(error);
  }
});

export async function restoreSession() {
  return requestRefresh();
}

export default api;
