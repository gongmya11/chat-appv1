import { useEffect, useState } from "react";
import { LogOut, Search, MoreHorizontal, Edit, MessageSquare, BellOff, Loader, Bell, UserPlus, Settings } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import ProfileModal from "./ProfileModal";
import NotificationDropdown from "./NotificationDropdown";
import FriendSearchModal from "./FriendSearchModal";

const Sidebar = () => {
  const { users, getUsers, isUsersLoading, selectedUser, setSelectedUser, unreadNotificationsCount } = useChat();
  const { authUser, logout, onlineUsers } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [logoError, setLogoError] = useState(false);
  const [mutedUsers, setMutedUsers] = useState(() => JSON.parse(localStorage.getItem("mutedUsers") || "[]"));
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFriendSearch, setShowFriendSearch] = useState(false);

  useEffect(() => {
    getUsers();

    const handleMuteChange = () => {
      setMutedUsers(JSON.parse(localStorage.getItem("mutedUsers") || "[]"));
    };
    window.addEventListener("mutedUsersChanged", handleMuteChange);
    return () => window.removeEventListener("mutedUsersChanged", handleMuteChange);
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderLastMessage = (user) => {
    if (!user.lastMessage) {
      return onlineUsers.includes(user._id) ? "Đang hoạt động" : "Ngoại tuyến";
    }
    
    const msg = user.lastMessage;
    const prefix = msg.sender === authUser._id ? "Bạn: " : "";
    
    if (msg.isRecalled) {
      return <span className="last-message-recalled">Tin nhắn đã bị thu hồi</span>;
    }
    
    if (msg.image && !msg.text) {
      return `${prefix}📷 Hình ảnh`;
    }
    
    return `${prefix}${msg.text}`;
  };

  // Lọc người dùng theo từ khóa tìm kiếm và tab bộ lọc
  const filteredUsers = users
    .filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((user) => {
      if (activeCategory === "Unread") {
        return user.unreadCount > 0;
      }
      if (activeCategory === "Online") {
        return onlineUsers.includes(user._id);
      }
      if (activeCategory === "Groups") {
        return false; // Được xử lý riêng biệt để hiển thị Empty State
      }
      return true; // "All"
    });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={authUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + authUser?.username}
              alt="Hồ sơ"
              onClick={() => setShowProfileModal(true)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                objectFit: "cover",
                border: "2.5px solid var(--color-primary)",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              title="Xem thông tin tài khoản"
            />
            <span className="sidebar-title" style={{ fontSize: "1.2rem", fontWeight: 800 }}>Mya app</span>
          </div>

          <div className="sidebar-actions" style={{ position: "relative" }}>
            <button 
              onClick={() => setShowProfileModal(true)} 
              className="sidebar-action-btn" 
              title="Chỉnh sửa hồ sơ cá nhân"
            >
              <Settings size={16} />
            </button>
            <button 
              onClick={() => setShowFriendSearch(true)} 
              className="sidebar-action-btn" 
              title="Tìm kiếm và thêm bạn bè"
            >
              <UserPlus size={16} />
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className="sidebar-action-btn" 
              title="Thông báo"
              style={{ position: "relative" }}
            >
              <Bell size={16} />
              {unreadNotificationsCount > 0 && (
                <span className="notification-badge">{unreadNotificationsCount}</span>
              )}
            </button>
            <button onClick={logout} className="sidebar-action-btn" title="Đăng xuất">
              <LogOut size={16} />
            </button>

            {/* Notification Dropdown */}
            <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>
        </div>

        <div className="sidebar-search-wrapper">
          <Search size={16} className="input-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs danh mục kiểu Facebook Messenger */}
      <div className="sidebar-categories">
        {["All", "Unread", "Online", "Groups"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`category-pill ${activeCategory === cat ? "active" : ""}`}
          >
            {cat === "All" ? "Hộp thư" : cat === "Unread" ? "Chưa đọc" : cat === "Online" ? "Trực tuyến" : "Nhóm"}
          </button>
        ))}
      </div>

      <div className="sidebar-users-list">
        {isUsersLoading ? (
          <div className="sidebar-loading-wrapper">
            <Loader className="spinner" size={24} />
          </div>
        ) : activeCategory === "Groups" ? (
          <div className="groups-empty-state">
            <div className="groups-empty-icon">
              <MessageSquare size={28} />
            </div>
            <h3>Trò chuyện nhóm</h3>
            <p>Tính năng chat nhóm nhiều thành viên đang phát triển và sẽ sớm ra mắt!</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Không tìm thấy hội thoại nào
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUser?._id === user._id;
            const isOnline = onlineUsers.includes(user._id);
            const isMuted = mutedUsers.includes(user._id);

            return (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`user-item ${isSelected ? "active" : ""}`}
              >
                <div className="avatar-wrapper">
                  <img
                    src={user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + user.username}
                    alt={user.username}
                    className="user-avatar"
                  />
                  {isOnline && <span className="online-indicator"></span>}
                </div>

                <div className="user-info">
                  <div className="user-name-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="user-name">{user.username}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isMuted && <BellOff size={13} style={{ color: "var(--text-secondary)" }} />}
                      {user.lastMessage && (
                        <span className="last-message-time" style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                          {formatTime(user.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="user-status-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                    <span className="user-status-text" style={{ flex: 1, marginRight: "8px" }}>
                      {renderLastMessage(user)}
                    </span>
                    {user.unreadCount > 0 && (
                      <span className="sidebar-unread-badge">
                        {user.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <ThemeToggle />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <FriendSearchModal isOpen={showFriendSearch} onClose={() => setShowFriendSearch(false)} />
    </aside>
  );
};

export default Sidebar;
