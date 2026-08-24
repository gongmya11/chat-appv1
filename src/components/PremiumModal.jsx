import { useState } from "react";
import { X, CreditCard, Copy, Sparkles, Check, Loader, Lock, QrCode } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuth } from "../context/AuthContext";

const PremiumModal = ({ isOpen, onClose }) => {
  const { updateAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState("pay"); // 'pay' or 'redeem'
  const [paymentMethod, setPaymentMethod] = useState("momo"); // 'momo', 'vnpay', 'visa'
  const [isTestMode, setIsTestMode] = useState(true); // default true for developer convenience
  
  // Payment states
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("VCB");
  
  // Process states
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Redeem states
  const [redeemKey, setRedeemKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: 'success' | 'error'
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  if (!isOpen) return null;

  // Handle Pay simulation
  const handlePay = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage({ text: "", type: "" });
    
    // Simulate API delay
    setTimeout(async () => {
      try {
        const amount = paymentMethod === "visa" ? 2 : 50000;
        const res = await axiosInstance.post("/premium/generate-key", {
          method: paymentMethod,
          amount,
          isTestMode
        });
        
        if (res.data?.success) {
          setGeneratedKey(res.data.key);
        } else {
          setMessage({ text: "Tạo key thất bại, vui lòng thử lại.", type: "error" });
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Lỗi giao dịch", type: "error" });
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  // Copy Key
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Activation
  const handleRedeem = async (e) => {
    if (e) e.preventDefault();
    const keyToRedeem = activeTab === "redeem" ? redeemKey : generatedKey;
    if (!keyToRedeem) return;

    setIsActivating(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await axiosInstance.post("/premium/redeem", { key: keyToRedeem });
      if (res.data?.premiumUntil) {
        updateAuthUser({ premiumUntil: res.data.premiumUntil });
        setMessage({ text: "Kích hoạt Premium thành công! Đã mở khóa Dark Mode.", type: "success" });
        
        // Auto close after 2.5s on success
        setTimeout(() => {
          onClose();
          // Reset states
          setGeneratedKey("");
          setRedeemKey("");
          setMessage({ text: "", type: "" });
        }, 2500);
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || "Mã kích hoạt không đúng hoặc đã qua sử dụng.", type: "error" });
    } finally {
      setIsActivating(false);
    }
  };

  // Auto-fill and Redeem helper
  const handleAutoRedeem = () => {
    if (!generatedKey) return;
    setIsActivating(true);
    setTimeout(async () => {
      try {
        const res = await axiosInstance.post("/premium/redeem", { key: generatedKey });
        if (res.data?.premiumUntil) {
          updateAuthUser({ premiumUntil: res.data.premiumUntil });
          setMessage({ text: "Kích hoạt Premium thành công! Đã mở khóa Dark Mode.", type: "success" });
          
          setTimeout(() => {
            onClose();
            setGeneratedKey("");
            setRedeemKey("");
            setMessage({ text: "", type: "" });
          }, 2000);
        }
      } catch (error) {
        setMessage({ text: error.response?.data?.message || "Lỗi tự động kích hoạt", type: "error" });
      } finally {
        setIsActivating(false);
      }
    }, 500);
  };

  return (
    <div className="premium-modal-overlay">
      <div className="premium-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="premium-modal-header">
          <div className="premium-header-title">
            <Sparkles className="premium-title-icon" size={20} />
            <h2>Nâng Cấp Premium Dark Mode</h2>
          </div>
          <button className="premium-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Description Banner */}
        <div className="premium-banner">
          <Lock className="banner-icon animate-pulse" size={24} />
          <div className="banner-text">
            <strong>Trải nghiệm Chế độ tối đẳng cấp</strong>
            <p>Mở khóa Dark Mode giúp bảo vệ mắt, giao diện Slate sang trọng chỉ với $2 (50.000đ) / ngày.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="premium-tabs">
          <button 
            className={`premium-tab-btn ${activeTab === "pay" ? "active" : ""}`}
            onClick={() => { setActiveTab("pay"); setMessage({ text: "", type: "" }); }}
          >
            Thanh Toán (Mua Key)
          </button>
          <button 
            className={`premium-tab-btn ${activeTab === "redeem" ? "active" : ""}`}
            onClick={() => { setActiveTab("redeem"); setMessage({ text: "", type: "" }); }}
          >
            Kích Hoạt (Nhập Mã Key)
          </button>
        </div>

        {/* Content Area */}
        <div className="premium-modal-content">
          
          {/* TAB 1: PAY */}
          {activeTab === "pay" && !generatedKey && (
            <form onSubmit={handlePay} className="premium-pay-form">
              {/* Test mode switch */}
              <div className="test-mode-toggle">
                <label className="toggle-switch-label">
                  <input 
                    type="checkbox" 
                    checked={isTestMode} 
                    onChange={(e) => setIsTestMode(e.target.checked)} 
                  />
                  <span className="toggle-switch-slider"></span>
                </label>
                <div className="test-mode-desc">
                  <strong>Chế độ Test (Hết hạn sau 2 phút)</strong>
                  <p>Tích vào để test nhanh tính năng đếm ngược gia hạn & tự hủy gói</p>
                </div>
              </div>

              {/* Payment Methods selector */}
              <div className="payment-methods">
                <div 
                  className={`payment-method-card ${paymentMethod === "momo" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("momo")}
                >
                  <div className="method-logo momo">MoMo</div>
                  <span>Momo QR</span>
                </div>
                <div 
                  className={`payment-method-card ${paymentMethod === "vnpay" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("vnpay")}
                >
                  <div className="method-logo vnpay">VNPay</div>
                  <span>VNPay</span>
                </div>
                <div 
                  className={`payment-method-card ${paymentMethod === "visa" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("visa")}
                >
                  <CreditCard className="visa-icon" size={24} />
                  <span>Thẻ Visa</span>
                </div>
              </div>

              {/* Payment details depending on method */}
              <div className="payment-method-details">
                {paymentMethod === "momo" && (
                  <div className="momo-qr-container">
                    <div className="qr-box">
                      <div 
                        className="mock-qr-code" 
                        style={{ padding: "4px", cursor: "zoom-in" }}
                        onClick={() => setIsQrZoomed(true)}
                        title="Click để phóng to mã QR"
                      >
                        <img 
                          src="/momo-qr.png" 
                          alt="Momo QR Code PHAM MINH HIEN" 
                          style={{ width: "130px", height: "auto", display: "block", borderRadius: "8px" }} 
                        />
                      </div>
                      <div className="qr-price" style={{ color: "#a50064", fontWeight: 800 }}>50.000đ</div>
                    </div>
                    <div className="qr-instructions">
                      <p><strong>Chủ tài khoản:</strong> PHẠM MINH HIỂN</p>
                      <p><strong>Số tài khoản:</strong> *******088</p>
                      <p><strong>Bước 1:</strong> Mở ứng dụng MoMo và quét mã QR bên trái.</p>
                      <p><strong>Bước 2:</strong> Nhập số tiền chuyển khoản: <strong>50.000đ</strong>.</p>
                      <p><strong>Bước 3:</strong> Nhấn nút "Xác Nhận Thanh Toán" để nhận key kích hoạt.</p>
                    </div>
                  </div>
                )}

                {paymentMethod === "vnpay" && (
                  <div className="vnpay-container">
                    <label className="input-label">Chọn Ngân Hàng:</label>
                    <select 
                      className="vnpay-select"
                      value={selectedBank} 
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <option value="VCB">Vietcombank</option>
                      <option value="TCB">Techcombank</option>
                      <option value="ACB">ACB Bank</option>
                      <option value="VTB">Vietinbank</option>
                      <option value="BIDV">BIDV</option>
                    </select>
                    <p className="payment-note">Hệ thống sẽ giả lập cổng VNPay của ngân hàng {selectedBank} để thực hiện giao dịch.</p>
                  </div>
                )}

                {paymentMethod === "visa" && (
                  <div className="visa-container">
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label className="input-label">Số thẻ Visa:</label>
                        <input 
                          type="text" 
                          placeholder="4111 2222 3333 4444" 
                          className="payment-input"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="input-label">Tên in trên thẻ:</label>
                        <input 
                          type="text" 
                          placeholder="NGUYEN VAN A" 
                          className="payment-input"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="input-label">Hạn dùng:</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          className="payment-input"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="input-label">CVV:</label>
                        <input 
                          type="password" 
                          placeholder="***" 
                          maxLength={3}
                          className="payment-input"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Payment button */}
              <button 
                type="submit" 
                className="premium-submit-btn" 
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader className="spinner" size={18} />
                    <span>Đang xử lý giao dịch...</span>
                  </>
                ) : (
                  <span>Xác Nhận Thanh Toán {paymentMethod === "visa" ? "$2" : "50.000đ"}</span>
                )}
              </button>
            </form>
          )}

          {/* TAB 1 SUCCESS: KEY GENERATED */}
          {activeTab === "pay" && generatedKey && (
            <div className="payment-success-card">
              <div className="success-icon-wrapper">
                <Check className="success-icon" size={32} />
              </div>
              <h3>Thanh Toán Thành Công!</h3>
              <p>Mã kích hoạt Dark Mode Premium của bạn đã được khởi tạo:</p>
              
              <div className="key-display-box">
                <code>{generatedKey}</code>
                <button 
                  type="button" 
                  onClick={handleCopy} 
                  className="copy-key-btn" 
                  title="Copy mã kích hoạt"
                >
                  {copied ? <Check size={16} style={{ color: "#27ae60" }} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="success-actions">
                <button 
                  type="button" 
                  className="btn-success-redeem"
                  onClick={handleAutoRedeem}
                  disabled={isActivating}
                >
                  {isActivating ? (
                    <>
                      <Loader className="spinner" size={16} />
                      <span>Đang kích hoạt...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Kích hoạt nhanh ngay lập tức</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel-modal"
                  onClick={() => {
                    setGeneratedKey("");
                    setActiveTab("redeem");
                  }}
                >
                  Sao chép và tự nhập thủ công
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REDEEM CODE */}
          {activeTab === "redeem" && (
            <form onSubmit={handleRedeem} className="premium-redeem-form">
              <div className="form-group">
                <label className="input-label">Nhập Mã Kích Hoạt (Key):</label>
                <input 
                  type="text" 
                  placeholder="Mã dạng DARK-XXXX-YYYY-ZZZZ" 
                  className="payment-input key-input"
                  value={redeemKey}
                  onChange={(e) => setRedeemKey(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="premium-submit-btn" 
                disabled={isActivating || !redeemKey}
              >
                {isActivating ? (
                  <>
                    <Loader className="spinner" size={18} />
                    <span>Đang xác minh & kích hoạt...</span>
                  </>
                ) : (
                  <span>Kích Hoạt Ngay</span>
                )}
              </button>
            </form>
          )}

          {/* Success / Error Message Box */}
          {message.text && (
            <div className={`modal-message-box ${message.type}`}>
              {message.type === "success" ? <Check size={16} /> : <X size={16} />}
              <span>{message.text}</span>
            </div>
          )}

        </div>
      </div>

      {/* Lightbox / Zoomed QR overlay */}
      {isQrZoomed && (
        <div 
          className="qr-zoom-overlay" 
          onClick={() => setIsQrZoomed(false)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 11000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "modalFadeIn 0.2s ease-out"
          }}
        >
          <div 
            className="qr-zoom-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "24px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              animation: "modalSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              maxWidth: "90%",
              width: "360px"
            }}
          >
            <img 
              src="/momo-qr.png" 
              alt="Momo QR Code PHAM MINH HIEN Large" 
              style={{ width: "100%", height: "auto", display: "block", borderRadius: "12px" }} 
            />
            <div style={{ color: "#1a1a1a", textAlign: "center", padding: "4px 0" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>PHẠM MINH HIỂN</div>
              <div style={{ color: "#666", fontSize: "0.85rem", marginTop: "2px" }}>Chuyển khoản MoMo - 50.000đ</div>
            </div>
            <button 
              onClick={() => setIsQrZoomed(false)}
              style={{
                background: "#a50064",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                width: "100%",
                marginTop: "4px"
              }}
            >
              Đóng ảnh
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PremiumModal;
