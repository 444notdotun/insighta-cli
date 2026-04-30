import axios from "axios";
import { loadCredentials, saveCredentials, clearCredentials } from "./credentials.js";

const BASE_URL = process.env.INSIGHTA_API_URL || "https://your-backend-url.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Version": "1",
  },
});

api.interceptors.request.use((config) => {
  const creds = loadCredentials();
  if (creds?.accessToken) {
    config.headers.Authorization = `Bearer ${creds.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const creds = loadCredentials();
      if (!creds?.refreshToken) {
        clearCredentials();
        console.error("Session expired. Please login again.");
        process.exit(1);
      }
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: creds.refreshToken,
        });
        const { accessToken, refreshToken } = res.data.data;
        saveCredentials({ ...creds, accessToken, refreshToken });
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        clearCredentials();
        console.error("Session expired. Please login again.");
        process.exit(1);
      }
    }
    return Promise.reject(error);
  }
);

export { BASE_URL };
export default api;
