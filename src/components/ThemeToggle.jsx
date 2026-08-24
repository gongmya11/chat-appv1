import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Lock, Sparkles, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PremiumModal from "./PremiumModal";

const ThemeToggle = () => {
  const { authUser } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("app-theme") || "light");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in milliseconds
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  
  const timerRef = useRef(null);

  // Helper to check premium status
  const getPremiumStatus = () => {
    if (!authUser || !authUser.premiumUntil) return { active: false, timeLeft: 0, isTest: false };
    const expiry = new Date(authUser.premiumUntil).getTime();
    const now = Date.now();
    const remaining = expiry - now;
    const active = remaining > 0;
    
    // Test mode if duration created was small (e.g. less than 1 hour, since standard is 24 hours)
    const totalDuration = expiry - new Date(authUser.createdAt).getTime(); // not fully accurate but we can just check if remaining is less than 5 minutes for test mode threshold
    // Let's check if the remaining time was initiated as a 2-minute test key.
    // If remaining is active, we can determine test mode if the duration is very short.
    // Actually, we can just say if the time left is <= 2 minutes (120000ms) when active, it's probably test key or near expiry.
    // Better: let's classify it as test mode if the remaining time is less than 5 minutes.
    const isTest = remaining > 0 && remaining <= 5 * 60 * 1000 && !window.hasHad24hPremium;
    
    return { active, timeLeft: remaining, isTest };
  };

  // Sync theme with DOM on mount and theme state change
  useEffect(() => {
    const { active } = getPremiumStatus();
    
    if (theme === "dark") {
      if (active) {
        document.documentElement.setAttribute("data-app-theme", "dark");
      } else {
        // If theme is set to dark but premium is inactive, force revert to light
        setTheme("light");
        localStorage.setItem("app-theme", "light");
        document.documentElement.removeAttribute("data-app-theme");
      }
    } else {
      document.documentElement.removeAttribute("data-app-theme");
    }
  }, [theme, authUser]);

  // Handle premium countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const updateTimer = () => {
      const { active, timeLeft: remaining, isTest } = getPremiumStatus();
      
      if (active) {
        setTimeLeft(remaining);
        
        // Expiration threshold:
        // Test key: under 30 seconds (30000ms) is expiring soon.
        // Normal key: under 5 minutes (300000ms) is expiring soon.
        // Since test mode lasts 2 mins, we check if remaining < 30s. If it's normal, check if remaining < 5 mins.
        // Let's define threshold: if remaining is under 5 mins and it's normal, or under 30s if it's test
        const isTestKey = remaining <= 2 * 60 * 1000 + 5000; // a buffer
        const threshold = isTestKey ? 30 * 1000 : 5 * 60 * 1000;
        
        if (remaining <= threshold) {
          setIsExpiringSoon(true);
        } else {
          setIsExpiringSoon(false);
        }
      } else {
        setTimeLeft(0);
        setIsExpiringSoon(false);
        
        // If premium expired and we are currently in dark mode, automatically revert
        if (theme === "dark") {
          setTheme("light");
          localStorage.setItem("app-theme", "light");
          document.documentElement.removeAttribute("data-app-theme");
          alert("Gói Premium Dark Mode của bạn đã hết hạn! Giao diện đã tự động chuyển về Chế độ sáng.");
        }
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [authUser, theme]);

  const handleThemeChange = (newTheme) => {
    if (newTheme === "light") {
      setTheme("light");
      localStorage.setItem("app-theme", "light");
    } else {
      // Toggle to dark - check premium first
      const { active } = getPremiumStatus();
      if (active) {
        setTheme("dark");
        localStorage.setItem("app-theme", "dark");
      } else {
        // Open payment modal
        setIsModalOpen(true);
      }
    }
  };

  // Format time remaining: HH:MM:SS or MM:SS
  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num) => String(num).padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const { active: isPremium } = getPremiumStatus();

  return (
    <div className="theme-toggle-container">
      <div className="theme-toggle-header">
        <span className="theme-label">Giao diện</span>
        {isPremium && (
          <div className={`premium-timer-badge ${isExpiringSoon ? "danger animate-pulse" : ""}`}>
            <Clock size={12} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      <div className="theme-toggle-switch">
        <button 
          className={`theme-toggle-btn ${theme === "light" ? "active" : ""}`}
          onClick={() => handleThemeChange("light")}
          title="Chế độ sáng"
        >
          <Sun size={15} />
          <span>Sáng</span>
        </button>

        <button 
          className={`theme-toggle-btn ${theme === "dark" ? "active" : ""} ${!isPremium ? "locked-btn" : ""}`}
          onClick={() => handleThemeChange("dark")}
          title={isPremium ? "Chế độ tối" : "Mở khóa Chế độ tối"}
        >
          {isPremium ? <Moon size={15} /> : <Lock size={13} className="lock-icon-margin" />}
          <span>Tối</span>
          {!isPremium && <span className="premium-price-tag">$2</span>}
        </button>
      </div>

      {/* Near expiration alert banner in sidebar */}
      {isPremium && isExpiringSoon && theme === "dark" && (
        <div 
          className="expiration-warning-banner" 
          onClick={() => setIsModalOpen(true)}
          title="Nhấp vào để gia hạn Premium"
        >
          <AlertTriangle size={14} className="warning-icon-pulse" />
          <span>Sắp hết hạn! Click để gia hạn.</span>
        </div>
      )}

      {/* Payment and activation Modal */}
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ThemeToggle;
