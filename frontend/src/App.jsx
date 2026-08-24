import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { Loader } from "lucide-react";

function App() {
  const { authUser, isCheckingAuth } = useAuth();

  if (isCheckingAuth && !authUser) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-main)",
        backgroundImage: "var(--bg-gradient)",
        color: "var(--color-primary)"
      }}>
        <Loader size={48} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={authUser ? <Home /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
