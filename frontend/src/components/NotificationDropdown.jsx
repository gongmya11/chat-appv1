import { useState, useRef, useEffect } from "react";
import { Check, X, Bell, Trash2, CheckCheck, Loader, MessageSquare, UserCheck, UserPlus } from "lucide-react";
import { useChat } from "../context/ChatContext";
import ProfileModal from "./ProfileModal";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    acceptFriendRequest,
    declineFriendRequest,
    setSelectedUser,
  } = useChat();

  const [inspectUserId, setInspectUserId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking inside a modal overlay (e.g., ProfileModal)
      if (e.target.closest(".premium-modal-overlay")) {
        return;
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAccept = async (e, senderId, notificationId) => {
    e.stopPropagation();
    setActionLoadingId(notificationId);
    await acceptFriendRequest(senderId);
    await markNotificationAsRead(notificationId);
    setActionLoadingId(null);
  };

  const handleDecline = async (e, senderId, notificationId) => {
    e.stopPropagation();
    setActionLoadingId(notificationId);
    await declineFriendRequest(senderId);
    await markNotificationAsRead(notificationId);
    setActionLoadingId(null);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(notification._id);
    }

    if (notification.type === "friend_request" || notification.type === "friend_accept") {
      // Open profile modal to inspect user
      setInspectUserId(notification.sender._id);
    } else if (notification.type === "message") {
      // Open chat with sender
      setSelectedUser(notification.sender);
      onClose();
    }
  };

  // Helper to format date
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="dropdown-header">
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>Thông báo</span>
        <div style={{ display: "flex", gap: "10px" }}>
          {notifications.length > 0 && (
            <>
              <button 
                onClick={markAllNotificationsAsRead} 
                className="action-btn"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={14} />
              </button>
              <button 
                onClick={clearNotifications} 
                className="action-btn"
                title="Xóa tất cả thông báo"
                style={{ color: "#e74c3c" }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="dropdown-body">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <Bell size={24} style={{ marginBottom: "8px", opacity: 0.4 }} />
            <span>Không có thông báo mới nào</span>
          </div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.isRead;
            return (
              <div 
                key={n._id}
                className={`notification-item ${isUnread ? "unread" : ""}`}
                onClick={() => handleNotificationClick(n)}
              >
                {/* Sender Avatar */}
                <div 
                  className="avatar-container"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectUserId(n.sender._id);
                  }}
                  title="Xem trang cá nhân"
                >
                  <img 
                    src={n.sender.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + n.sender.username}
                    alt={n.sender.username}
                    className="sender-avatar"
                  />
                  <div className={`type-badge ${n.type}`}>
                    {n.type === "friend_request" && <UserPlus size={8} />}
                    {n.type === "friend_accept" && <UserCheck size={8} />}
                    {n.type === "message" && <MessageSquare size={8} />}
                  </div>
                </div>

                {/* Content */}
                <div className="notification-content">
                  <p className="notification-text">
                    <strong style={{ color: "var(--text-primary)" }}>{n.sender.username}</strong>{" "}
                    {n.type === "friend_request" && "đã gửi cho bạn lời mời kết bạn."}
                    {n.type === "friend_accept" && "đã chấp nhận lời mời kết bạn của bạn."}
                    {n.type === "message" && "đã gửi một tin nhắn mới cho bạn."}
                  </p>
                  <span className="notification-time">{formatTime(n.createdAt)}</span>

                  {/* Actions for Friend Request inline */}
                  {n.type === "friend_request" && (
                    <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                      {actionLoadingId === n._id ? (
                        <Loader size={14} className="spinner" />
                      ) : (
                        <>
                          <button 
                            className="btn-accept"
                            onClick={(e) => handleAccept(e, n.sender._id, n._id)}
                          >
                            Đồng ý
                          </button>
                          <button 
                            className="btn-decline"
                            onClick={(e) => handleDecline(e, n.sender._id, n._id)}
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Unread indicator */}
                {isUnread && <span className="unread-dot"></span>}
              </div>
            );
          })
        )}
      </div>

      {/* Embedded ProfileModal for viewing other users' details */}
      <ProfileModal 
        isOpen={!!inspectUserId} 
        onClose={() => setInspectUserId(null)} 
        userId={inspectUserId} 
      />
    </div>
  );
};

export default NotificationDropdown;
