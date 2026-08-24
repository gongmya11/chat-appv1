import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${hostname}:5000/api`;
};

export const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Tự động gửi kèm cookies (JWT) khi gọi API
});

// Thêm interceptor để tự động chèn token từ localStorage vào Authorization header (cho môi trường chéo tên miền)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chat-app-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
