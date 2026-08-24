import { Bell, BellOff, Search, ShieldAlert, Image, FileText, Pin, PinOff, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useState, useEffect } from "react";
import ProfileModal from "./ProfileModal";


const DetailsSidebar = ({ user, showChatSearch, setShowChatSearch, setShowRightSidebar }) => {
  const { onlineUsers } = useAuth();
  const { messages, togglePinMessage } = useChat();
  const isOnline = onlineUsers.includes(user._id);

  const [isMuted, setIsMuted] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Lấy trạng thái tắt thông báo từ localStorage
  useEffect(() => {
    const mutedUsers = JSON.parse(localStorage.getItem("mutedUsers") || "[]");
    setIsMuted(mutedUsers.includes(user._id));
  }, [user._id]);

  // Bật/tắt thông báo
  const handleToggleMute = () => {
    let mutedUsers = JSON.parse(localStorage.getItem("mutedUsers") || "[]");
    if (mutedUsers.includes(user._id)) {
      mutedUsers = mutedUsers.filter((id) => id !== user._id);
      setIsMuted(false);
    } else {
      mutedUsers.push(user._id);
      setIsMuted(true);
    }
    localStorage.setItem("mutedUsers", JSON.stringify(mutedUsers));
    
    // Gửi sự kiện để đồng bộ hóa giao diện cột Sidebar danh sách người dùng
    window.dispatchEvent(new Event("mutedUsersChanged"));
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="details-sidebar">
      {/* Nút đóng dành cho thiết bị di động */}
      <button 
        className="details-close-btn mobile-only" 
        onClick={() => setShowRightSidebar(false)}
        title="Đóng chi tiết"
      >
        <X size={18} />
      </button>

      <div className="details-avatar-wrapper" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }} title="Xem thông tin chi tiết">
        <img
          src={user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + user.username}
          alt={user.username}
          className="details-avatar"
        />
      </div>

      <h3 className="details-name" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }} title="Xem thông tin chi tiết">{user.username}</h3>
      <span className="details-status-badge">
        {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
      </span>

      <div className="details-quick-actions">
        <div className="quick-action-item" onClick={handleToggleMute}>
          <button className="quick-action-icon-btn" style={{ color: isMuted ? "var(--color-primary)" : "" }}>
            {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
          </button>
          <span>{isMuted ? "Bật thông báo" : "Tắt thông báo"}</span>
        </div>
        <div className="quick-action-item" onClick={() => setShowChatSearch(!showChatSearch)}>
          <button className="quick-action-icon-btn" style={{ color: showChatSearch ? "var(--color-primary)" : "" }}>
            <Search size={18} />
          </button>
          <span>Tìm kiếm</span>
        </div>
      </div>

      <div className="details-accordion">
        <details className="accordion-item" open>
          <summary className="accordion-header">Thông tin đoạn chat</summary>
          <div className="accordion-content" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Pin size={16} />
              <span>Xem tin nhắn đã ghim ({pinnedMessages.length})</span>
            </div>

            {pinnedMessages.length > 0 && (
              <div 
                className="pinned-sidebar-list" 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "6px", 
                  paddingLeft: "26px", 
                  marginTop: "8px", 
                  maxHeight: "200px", 
                  overflowY: "auto" 
                }}
              >
                {pinnedMessages.map((m) => (
                  <div
                    key={m._id}
                    className="pinned-sidebar-item"
                    onClick={() => {
                      const el = document.getElementById(`msg-${m._id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("highlight-pulse");
                        setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "6px 8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "background 0.2s"
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>
                      {m.text ? m.text : "🖼️ Hình ảnh"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinMessage(m._id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center"
                      }}
                      title="Bỏ ghim"
                    >
                      <PinOff size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        <details className="accordion-item">
          <summary className="accordion-header">File phương tiện & tài liệu</summary>
          <div className="accordion-content" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <Image size={16} />
              <span>Hình ảnh đã gửi</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <FileText size={16} />
              <span>Tài liệu & liên kết</span>
            </div>
          </div>
        </details>

        <details className="accordion-item">
          <summary className="accordion-header">Quyền riêng tư & hỗ trợ</summary>
          <div className="accordion-content" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#ff4d4d", cursor: "pointer" }}>
              <ShieldAlert size={16} />
              <span>Báo cáo / Chặn người dùng</span>
            </div>
          </div>
        </details>
      </div>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} userId={user._id} />
    </div>
  );
};

export default DetailsSidebar;
