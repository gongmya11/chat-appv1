import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Edit2, Check, Loader, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const ProfileModal = ({ isOpen, onClose, userId }) => {
  const { authUser, updateProfile } = useAuth();
  const {
    users,
    setSelectedUser,
    getUserProfile,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriend
  } = useChat();

  // Determine if it's our own profile or another user's profile
  const isOwnProfile = !userId || userId === authUser?._id;
  
  // Find the target user details
  const [user, setUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    gender: "",
    dob: "",
    phone: "",
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const loadProfile = async () => {
      setIsEditing(false);
      setErrorMsg("");
      
      if (isOwnProfile) {
        setUser(authUser);
      } else {
        setIsLoadingProfile(true);
        const fetchedUser = await getUserProfile(userId);
        if (fetchedUser) {
          setUser(fetchedUser);
        } else {
          const foundUser = users.find((u) => u._id === userId);
          setUser(foundUser ? { ...foundUser, friendshipStatus: "none" } : null);
        }
        setIsLoadingProfile(false);
      }
    };
    
    loadProfile();
  }, [isOpen, userId, authUser, isOwnProfile]);

  const handleAddFriend = async () => {
    setIsSaving(true);
    const res = await sendFriendRequest(user._id);
    if (res.success) {
      const updated = await getUserProfile(user._id);
      if (updated) setUser(updated);
    } else {
      setErrorMsg(res.message);
    }
    setIsSaving(false);
  };

  const handleAcceptFriend = async () => {
    setIsSaving(true);
    const res = await acceptFriendRequest(user._id);
    if (res.success) {
      const updated = await getUserProfile(user._id);
      if (updated) setUser(updated);
    } else {
      setErrorMsg(res.message);
    }
    setIsSaving(false);
  };

  const handleDeclineFriend = async () => {
    setIsSaving(true);
    const res = await declineFriendRequest(user._id);
    if (res.success) {
      const updated = await getUserProfile(user._id);
      if (updated) setUser(updated);
    } else {
      setErrorMsg(res.message);
    }
    setIsSaving(false);
  };

  const handleUnfriend = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${user.username}?`)) return;
    setIsSaving(true);
    const res = await unfriend(user._id);
    if (res.success) {
      const updated = await getUserProfile(user._id);
      if (updated) setUser(updated);
    } else {
      setErrorMsg(res.message);
    }
    setIsSaving(false);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        gender: user.gender || "Nam",
        dob: user.dob || "",
        phone: user.phone || "",
      });
      setAvatarPreview(user.avatar || "");
      setCoverPreview(user.coverPhoto || "");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Kích thước ảnh phải nhỏ hơn 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (field === "avatar") {
        setAvatarPreview(reader.result);
      } else if (field === "coverPhoto") {
        setCoverPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await updateProfile({
        username: formData.username,
        bio: formData.bio,
        gender: formData.gender,
        dob: formData.dob,
        phone: formData.phone,
        avatar: avatarPreview,
        coverPhoto: coverPreview,
      });

      if (res.success) {
        setIsEditing(false);
      } else {
        setErrorMsg(res.message || "Không thể cập nhật hồ sơ");
      }
    } catch (error) {
      setErrorMsg("Có lỗi xảy ra khi lưu thay đổi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMessageClick = () => {
    setSelectedUser(user);
    onClose();
  };

  const defaultCoverGradient = "linear-gradient(135deg, var(--bg-body) 0%, rgba(0,0,0,0.4) 100%)";
  const coverStyle = coverPreview
    ? { backgroundImage: `url(${coverPreview})` }
    : { background: defaultCoverGradient };

  return createPortal(
    <div className="premium-modal-overlay" onClick={onClose}>
      <div 
        className="profile-card-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Title Bar */}
        <div className="profile-card-header">
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>Thông tin tài khoản</span>
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
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cover Photo */}
        <div 
          className="profile-cover-section"
          style={{
            ...coverStyle
          }}
        >
          {isOwnProfile && isEditing && (
            <>
              <input 
                type="file" 
                ref={coverInputRef} 
                style={{ display: "none" }} 
                accept="image/*"
                onChange={(e) => handleFileChange(e, "coverPhoto")}
              />
              <button 
                onClick={() => coverInputRef.current?.click()}
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                }}
                title="Thay đổi ảnh bìa"
              >
                <Camera size={16} />
              </button>
            </>
          )}
        </div>

        {/* Profile Card Body */}
        <div style={{ padding: "0 20px 20px 20px", marginTop: "-40px", position: "relative", zIndex: 3 }}>
          
          {/* Avatar & Display Name Layout */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginBottom: "16px" }}>
            
            {/* Avatar Circle Container */}
            <div style={{ position: "relative" }}>
              <img 
                src={avatarPreview || "https://api.dicebear.com/7.x/bottts/svg?seed=" + user.username} 
                alt={user.username}
                className="profile-avatar-img"
              />
              {isOwnProfile && isEditing && (
                <>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    style={{ display: "none" }} 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "avatar")}
                  />
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      right: "2px",
                      background: "var(--color-primary)",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                    }}
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera size={12} />
                  </button>
                </>
              )}
            </div>

            {/* User Name & Edit Button */}
            <div style={{ paddingBottom: "10px" }}>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="profile-input-field"
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    width: "180px"
                  }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    {user.username}
                  </h2>
                  {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                        padding: "4px",
                        borderRadius: "50%",
                        display: "flex",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Button: Nhắn tin hoặc Sửa thông tin */}
          <div style={{ marginBottom: "20px" }}>
            {isLoadingProfile ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
                <Loader size={20} className="spinner" />
              </div>
            ) : !isOwnProfile ? (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {user.friendshipStatus === "friends" && (
                  <>
                    <button 
                      onClick={handleMessageClick}
                      className="profile-btn-primary"
                      style={{ flex: 1 }}
                    >
                      <MessageSquare size={16} />
                      Nhắn tin
                    </button>
                    <button 
                      onClick={handleUnfriend}
                      disabled={isSaving}
                      className="profile-btn-secondary"
                      style={{ flex: 1, borderColor: "#e74c3c", color: "#e74c3c" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(231, 76, 60, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      Hủy kết bạn
                    </button>
                  </>
                )}

                {user.friendshipStatus === "none" && (
                  <button 
                    onClick={handleAddFriend}
                    disabled={isSaving}
                    className="profile-btn-primary"
                    style={{ flex: 1 }}
                  >
                    {isSaving ? <Loader size={16} className="spinner" /> : null}
                    Kết bạn
                  </button>
                )}

                {user.friendshipStatus === "sent_pending" && (
                  <button 
                    disabled={true}
                    className="profile-btn-secondary"
                    style={{ flex: 1, cursor: "not-allowed", opacity: 0.7 }}
                  >
                    Đã gửi yêu cầu kết bạn
                  </button>
                )}

                {user.friendshipStatus === "received_pending" && (
                  <>
                    <button 
                      onClick={handleAcceptFriend}
                      disabled={isSaving}
                      className="profile-btn-primary"
                      style={{ flex: 1 }}
                    >
                      {isSaving ? <Loader size={16} className="spinner" /> : null}
                      Chấp nhận
                    </button>
                    <button 
                      onClick={handleDeclineFriend}
                      disabled={isSaving}
                      className="profile-btn-secondary"
                      style={{ flex: 1 }}
                    >
                      {isSaving ? <Loader size={16} className="spinner" /> : null}
                      Từ chối
                    </button>
                  </>
                )}
              </div>
            ) : isEditing ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="profile-btn-primary"
                  style={{ flex: 1 }}
                >
                  {isSaving ? <Loader size={16} className="spinner" /> : <Check size={16} />}
                  Lưu thay đổi
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarPreview(user.avatar || "");
                    setCoverPreview(user.coverPhoto || "");
                    setFormData({
                      username: user.username || "",
                      bio: user.bio || "",
                      gender: user.gender || "Nam",
                      dob: user.dob || "",
                      phone: user.phone || "",
                    });
                  }}
                  disabled={isSaving}
                  className="profile-btn-secondary"
                  style={{ width: "auto" }}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="profile-btn-secondary"
              >
                Chỉnh sửa thông tin
              </button>
            )}
          </div>

          {/* Personal Info Grid */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Thông tin cá nhân
            </h4>
            
            {errorMsg && (
              <div 
                style={{ 
                  color: "#e74c3c", 
                  background: "rgba(231, 76, 60, 0.1)", 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  fontSize: "0.8rem", 
                  marginBottom: "12px",
                  fontWeight: 600
                }}
              >
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* Bio Field */}
              <div className="profile-info-row" style={{ alignItems: "flex-start" }}>
                <span className="profile-info-label">Bio</span>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Nhập tiểu sử ngắn..."
                      className="profile-input-field"
                    />
                  ) : (
                    <span className="profile-info-value">
                      {user.bio || "Chưa thiết lập tiểu sử"}
                    </span>
                  )}
                </div>
              </div>

              {/* Gender Field */}
              <div className="profile-info-row">
                <span className="profile-info-label">Giới tính</span>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="profile-input-field"
                      style={{ cursor: "pointer" }}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  ) : (
                    <span className="profile-info-value">
                      {user.gender || "Chưa thiết lập"}
                    </span>
                  )}
                </div>
              </div>

              {/* DOB Field */}
              <div className="profile-info-row">
                <span className="profile-info-label">Ngày sinh</span>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      placeholder="Ví dụ: 01 tháng 11, 2005"
                      className="profile-input-field"
                    />
                  ) : (
                    <span className="profile-info-value">
                      {user.dob || "Chưa thiết lập"}
                    </span>
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div className="profile-info-row">
                <span className="profile-info-label">Điện thoại</span>
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Nhập số điện thoại..."
                      className="profile-input-field"
                    />
                  ) : (
                    <span className="profile-info-value">
                      {user.phone || "Chưa thiết lập"}
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
