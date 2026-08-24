import { Phone, Video, Info, ChevronLeft } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ProfileModal from "./ProfileModal";

const ChatHeader = ({ showRightSidebar, setShowRightSidebar }) => {
  const { selectedUser, setSelectedUser } = useChat();
  const { onlineUsers } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="chat-header">
      <div className="chat-header-info">
        {/* Nút quay lại dành cho mobile */}
        <button 
          className="header-icon-btn mobile-only" 
          onClick={() => setSelectedUser(null)}
        >
          <ChevronLeft size={20} />
        </button>

        <div 
          className="avatar-wrapper header-avatar" 
          onClick={() => setShowProfileModal(true)} 
          style={{ cursor: "pointer" }}
          title="Xem thông tin chi tiết"
        >
          <img
            src={selectedUser.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + selectedUser.username}
            alt={selectedUser.username}
            className="user-avatar"
          />
          {isOnline && <span className="online-indicator"></span>}
        </div>
        <div onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }} title="Xem thông tin chi tiết">
          <h3 className="header-name">{selectedUser.username}</h3>
          <p className="header-status">
            {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button className="header-icon-btn" title="Bắt đầu cuộc gọi thoại">
          <Phone size={18} />
        </button>
        <button className="header-icon-btn" title="Bắt đầu cuộc gọi video">
          <Video size={18} />
        </button>
        <button 
          className={`header-icon-btn ${showRightSidebar ? "active" : ""}`}
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          title="Thông tin về cuộc trò chuyện"
        >
          <Info size={18} />
        </button>
      </div>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} userId={selectedUser._id} />
    </div>
  );
};

export default ChatHeader;
