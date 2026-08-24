import { useState, useEffect } from "react";
import { X, Search, UserPlus, UserCheck, MessageSquare, Loader, UserX, Sparkles } from "lucide-react";
import { useChat } from "../context/ChatContext";
import ProfileModal from "./ProfileModal";

const FriendSearchModal = ({ isOpen, onClose }) => {
  const {
    searchFriends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    setSelectedUser,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [inspectUserId, setInspectUserId] = useState(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const results = await searchFriends("");
      setSearchResults(results);
      if (results.length === 0) {
        setErrorMsg("Không có gợi ý người dùng nào mới");
      }
    } catch (err) {
      setErrorMsg("Lỗi khi tải gợi ý");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    } else {
      setSearchQuery("");
      setSearchResults([]);
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      const results = await searchFriends(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setErrorMsg("Không tìm thấy người dùng nào phù hợp");
      }
    } catch (err) {
      setErrorMsg("Lỗi khi tìm kiếm bạn bè");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (userId) => {
    setActionLoadingId(userId);
    const res = await sendFriendRequest(userId);
    if (res.success) {
      // Update local search results status
      setSearchResults((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, friendshipStatus: "sent_pending" } : user
        )
      );
    } else {
      alert(res.message);
    }
    setActionLoadingId(null);
  };

  const handleAcceptFriend = async (userId) => {
    setActionLoadingId(userId);
    const res = await acceptFriendRequest(userId);
    if (res.success) {
      setSearchResults((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, friendshipStatus: "friends" } : user
        )
      );
    } else {
      alert(res.message);
    }
    setActionLoadingId(null);
  };

  const handleDeclineFriend = async (userId) => {
    setActionLoadingId(userId);
    const res = await declineFriendRequest(userId);
    if (res.success) {
      setSearchResults((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, friendshipStatus: "none" } : user
        )
      );
    } else {
      alert(res.message);
    }
    setActionLoadingId(null);
  };

  const handleStartChat = (user) => {
    setSelectedUser(user);
    onClose();
  };

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div 
        className="profile-card-container" 
        style={{ maxWidth: "460px", padding: "20px", height: "auto", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Tìm kiếm bạn bè
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              padding: "4px",
              borderRadius: "50%",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <div className="sidebar-search-wrapper" style={{ flex: 1, margin: 0 }}>
            <Search size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Nhập email hoặc tên đăng nhập..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val.trim()) {
                  fetchSuggestions();
                }
              }}
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            className="profile-btn-primary" 
            style={{ width: "auto", padding: "0 16px" }}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? <Loader size={16} className="spinner" /> : "Tìm"}
          </button>
        </form>

        {/* Results Container */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: "200px", maxHeight: "400px" }}>
          {errorMsg && (
            <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px 0", fontSize: "0.9rem" }}>
              {errorMsg}
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {!searchQuery && (
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={12} style={{ color: "var(--color-primary)" }} />
                  <span>Gợi ý kết bạn mới</span>
                </div>
              )}
              {searchResults.map((user) => (
                <div 
                  key={user._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--bg-hover)",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  {/* User info click to view profile */}
                  <div 
                    onClick={() => setInspectUserId(user._id)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1 }}
                    title="Nhấp để xem trang cá nhân"
                  >
                    <img 
                      src={user.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + user.username}
                      alt={user.username}
                      style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {user.username}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {actionLoadingId === user._id ? (
                      <Loader size={16} className="spinner" style={{ margin: "10px" }} />
                    ) : (
                      <>
                        {user.friendshipStatus === "none" && (
                          <button 
                            className="profile-btn-primary" 
                            style={{ padding: "6px 10px", fontSize: "0.75rem", width: "auto" }}
                            onClick={() => handleAddFriend(user._id)}
                          >
                            <UserPlus size={12} style={{ marginRight: "4px" }} />
                            Kết bạn
                          </button>
                        )}

                        {user.friendshipStatus === "sent_pending" && (
                          <button 
                            className="profile-btn-secondary" 
                            style={{ padding: "6px 10px", fontSize: "0.75rem", width: "auto", opacity: 0.7, cursor: "not-allowed" }}
                            disabled
                          >
                            Đã gửi y/c
                          </button>
                        )}

                        {user.friendshipStatus === "received_pending" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button 
                              className="profile-btn-primary" 
                              style={{ padding: "6px 8px", fontSize: "0.75rem", width: "auto" }}
                              onClick={() => handleAcceptFriend(user._id)}
                              title="Chấp nhận"
                            >
                              <UserCheck size={12} />
                            </button>
                            <button 
                              className="profile-btn-secondary" 
                              style={{ padding: "6px 8px", fontSize: "0.75rem", width: "auto", borderColor: "#e74c3c", color: "#e74c3c" }}
                              onClick={() => handleDeclineFriend(user._id)}
                              title="Từ chối"
                            >
                              <UserX size={12} />
                            </button>
                          </div>
                        )}

                        {user.friendshipStatus === "friends" && (
                          <button 
                            className="profile-btn-primary" 
                            style={{ padding: "6px 10px", fontSize: "0.75rem", width: "auto", background: "var(--color-success)" }}
                            onClick={() => handleStartChat(user)}
                          >
                            <MessageSquare size={12} style={{ marginRight: "4px" }} />
                            Nhắn tin
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Embedded ProfileModal for viewing other users' details */}
      <ProfileModal 
        isOpen={!!inspectUserId} 
        onClose={() => {
          setInspectUserId(null);
          // Refresh search list status when closing inspect modal (friend status could have changed)
          if (searchQuery.trim()) {
            searchFriends(searchQuery).then(results => setSearchResults(results)).catch(() => {});
          }
        }} 
        userId={inspectUserId} 
      />
    </div>
  );
};

export default FriendSearchModal;
