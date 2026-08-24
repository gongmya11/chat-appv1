import { createContext, useContext, useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const AuthContext = createContext();

const getBackendBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_BASE_URL) return import.meta.env.VITE_BACKEND_BASE_URL;
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/api$/, "");
  }
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${hostname}:5000`;
};

const BACKEND_BASE_URL = getBackendBaseUrl();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      setAuthUser(res.data);
    } catch (error) {
      console.log("Error in checkAuth:", error.response?.data?.message || error.message);
      setAuthUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const signup = async (data) => {
    setIsSigningUp(true);
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      setAuthUser(res.data);
      if (res.data.token) {
        localStorage.setItem("chat-app-token", res.data.token);
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Đăng ký thất bại";
      return { success: false, message };
    } finally {
      setIsSigningUp(false);
    }
  };

  const login = async (data) => {
    setIsLoggingIn(true);
    try {
      const res = await axiosInstance.post("/auth/login", data);
      setAuthUser(res.data);
      if (res.data.token) {
        localStorage.setItem("chat-app-token", res.data.token);
      }
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Đăng nhập thất bại";
      return { success: false, message };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      setAuthUser(null);
      localStorage.removeItem("chat-app-token");
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    } catch (error) {
      console.log("Error in logout:", error.message);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Kết nối Socket.io khi đã xác thực người dùng
    const newSocket = io(BACKEND_BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [authUser]);

  const updateAuthUser = (updatedFields) => {
    setAuthUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const updateProfile = async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      setAuthUser(res.data);
      return { success: true, user: res.data };
    } catch (error) {
      const message = error.response?.data?.message || "Cập nhật hồ sơ thất bại";
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        isCheckingAuth,
        isLoggingIn,
        isSigningUp,
        onlineUsers,
        socket,
        signup,
        login,
        logout,
        updateAuthUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
