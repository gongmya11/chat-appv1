import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Mascot Left (Blue Hair, peeking)
const MascotLeft = ({ isHiding }) => (
  <svg className={`peeking-mascot left ${isHiding ? "hiding" : ""}`} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 100 C20 70, 100 70, 100 100 Z" fill="#ffd1b3" />
    
    {/* Open Eyes */}
    <g className="eyes-open">
      <circle cx="45" cy="85" r="7" fill="#8b5a2b" />
      <circle cx="47" cy="83" r="2.5" fill="#ffffff" />
      <circle cx="75" cy="85" r="7" fill="#8b5a2b" />
      <circle cx="77" cy="83" r="2.5" fill="#ffffff" />
    </g>

    {/* Closed Eyes */}
    <g className="eyes-closed">
      <path d="M38 85 Q45 80 52 85" stroke="#8b5a2b" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M68 85 Q75 80 82 85" stroke="#8b5a2b" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>

    <ellipse cx="37" cy="92" rx="6" ry="3" fill="#ff9999" opacity="0.6" />
    <ellipse cx="83" cy="92" rx="6" ry="3" fill="#ff9999" opacity="0.6" />
    <path d="M56 94 Q60 98 64 94" stroke="#8b5a2b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M20 80 C20 50, 100 50, 100 80 C90 75, 30 75, 20 80 Z" fill="#3a86ff" />
    <path d="M22 65 L8 45 L32 55 Z" fill="#3a86ff" />
    <path d="M20 62 L11 48 L27 55 Z" fill="#00b4d8" />
    <path d="M98 65 L112 45 L88 55 Z" fill="#3a86ff" />
    <path d="M100 62 L111 48 L93 55 Z" fill="#00b4d8" />
    <circle className="mascot-hand left-hand" cx="28" cy="115" r="7" fill="#ffd1b3" stroke="#e8eaed" strokeWidth="1.5" />
    <circle className="mascot-hand right-hand" cx="92" cy="115" r="7" fill="#ffd1b3" stroke="#e8eaed" strokeWidth="1.5" />
  </svg>
);

// Mascot Right (White/Pink Hair, peeking)
const MascotRight = ({ isHiding }) => (
  <svg className={`peeking-mascot right ${isHiding ? "hiding" : ""}`} width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 100 C20 70, 100 70, 100 100 Z" fill="#ffd1b3" />
    
    {/* Open Eyes */}
    <g className="eyes-open">
      <circle cx="45" cy="85" r="7" fill="#333333" />
      <circle cx="47" cy="83" r="2.5" fill="#ffffff" />
      <circle cx="75" cy="85" r="7" fill="#333333" />
      <circle cx="77" cy="83" r="2.5" fill="#ffffff" />
    </g>

    {/* Closed Eyes */}
    <g className="eyes-closed">
      <path d="M38 85 Q45 80 52 85" stroke="#333333" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M68 85 Q75 80 82 85" stroke="#333333" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>

    <ellipse cx="37" cy="92" rx="6" ry="3" fill="#ff9999" opacity="0.6" />
    <ellipse cx="83" cy="92" rx="6" ry="3" fill="#ff9999" opacity="0.6" />
    <path d="M57 93 Q60 90 63 93" stroke="#333333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M20 80 C20 50, 100 50, 100 80 C90 75, 30 75, 20 80 Z" fill="#f472b6" />
    <path d="M22 65 L8 45 L32 55 Z" fill="#f472b6" />
    <path d="M20 62 L11 48 L27 55 Z" fill="#ff99bb" />
    <path d="M98 65 L112 45 L88 55 Z" fill="#f472b6" />
    <path d="M100 62 L111 48 L93 55 Z" fill="#ff99bb" />
    <circle className="mascot-hand left-hand" cx="28" cy="115" r="7" fill="#ffd1b3" stroke="#e8eaed" strokeWidth="1.5" />
    <circle className="mascot-hand right-hand" cx="92" cy="115" r="7" fill="#ffd1b3" stroke="#e8eaed" strokeWidth="1.5" />
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusPassword, setIsFocusPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login, isLoggingIn } = useAuth();

  const validateForm = () => {
    if (!formData.email.trim()) return "Vui lòng nhập email / tài khoản";
    if (!formData.password) return "Vui lòng nhập mật khẩu";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const result = await login(formData);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <MascotLeft isHiding={isFocusPassword && !showPassword} />
      <MascotRight isHiding={isFocusPassword && !showPassword} />

      <div className="auth-card-container bili-style single-column">
        {/* Centered Login Form */}
        <div className="auth-right-bili-form">
          <h2 className="auth-card-title" style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", marginBottom: "30px", color: "var(--text-primary)" }}>
            Đăng nhập tài khoản
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            {errorMsg && (
              <div className="auth-error-box" style={{ marginBottom: "15px" }}>
                {errorMsg}
              </div>
            )}

            {/* Account field */}
            <div className="bili-input-group">
              <span className="bili-input-label">Tài khoản</span>
              <input
                type="text"
                placeholder="Nhập email hoặc tài khoản"
                className="bili-input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password field */}
            <div className="bili-input-group">
              <span className="bili-input-label">Mật khẩu</span>
              <div className="bili-input-inner-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  className="bili-input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setIsFocusPassword(true)}
                  onBlur={() => setIsFocusPassword(false)}
                />
                <div className="bili-input-right-actions">
                  <button
                    type="button"
                    className="bili-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <Link
                    to="#"
                    className="bili-forgot-link-inline"
                    onClick={() => alert("Chức năng đang phát triển!")}
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="bili-action-buttons">
              <Link to="/signup" className="bili-btn-outline">
                Đăng ký
              </Link>
              <button type="submit" className="bili-btn-solid" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Loader size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                    <span>Đăng nhập...</span>
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </div>
          </form>



          <div className="bili-disclaimer">
            Đăng nhập đồng nghĩa với việc bạn đồng ý với{" "}
            <Link to="#" onClick={() => alert("Điều khoản dịch vụ")}>
              Thỏa thuận người dùng
            </Link>{" "}
            và{" "}
            <Link to="#" onClick={() => alert("Chính sách bảo mật")}>
              Chính sách bảo mật
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;



