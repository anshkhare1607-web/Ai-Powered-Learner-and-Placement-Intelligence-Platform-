import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081"

});

// Automatically add the JWT token to the headers of every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    // Only attach the Authorization header if there is a token and it is not an authentication request
    if (token && config.url && !config.url.includes("/auth/")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api;