import { useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { Search, Pin, X, Reply, Pencil, Trash2, Loader, Copy } from "lucide-react";

const ChatContainer = ({ 
  showRightSidebar, 
  setShowRightSidebar,
  showChatSearch,
  setShowChatSearch,
  chatSearchQuery,
  setChatSearchQuery
}) => {
  const { 
    messages, 
    getMessages, 
    isMessagesLoading, 
    selectedUser, 
    togglePinMessage,
    recallMessage 
  } = useChat();
  const { authUser } = useAuth();
  const feedRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [likes, setLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat-likes") || "{}");
    } catch (e) {
      return {};
    }
  });

  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Gửi ảnh sang MessageInput thông qua CustomEvent
          const event = new CustomEvent("attach-image", { detail: reader.result });
          window.dispatchEvent(event);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Vui lòng chỉ kéo thả hình ảnh!");
      }
    }
  };

  // Like (Thả tim)
  const handleToggleLike = (messageId) => {
    const updatedLikes = { ...likes, [messageId]: !likes[messageId] };
    setLikes(updatedLikes);
    localStorage.setItem("chat-likes", JSON.stringify(updatedLikes));
  };

  const handleDoubleClickMessage = (e, messageId) => {
    e.preventDefault();
    // Nếu chưa thả tim thì mới toggle (để double click luôn thả tim, tránh việc double click gây ra unlike làm mất tự nhiên)
    if (!likes[messageId]) {
      handleToggleLike(messageId);
    }

    // Spawn hiệu ứng tim bay
    const bubbleElement = e.currentTarget;
    const heart = document.createElement("div");
    heart.className = "floating-heart";
    heart.innerText = "❤️";
    bubbleElement.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 850);
  };

  const handleReplyClick = (msg) => {
    setReplyingTo(msg);
    setEditingMessage(null);
  };

  const handleEditClick = (msg) => {
    setEditingMessage(msg);
    setReplyingTo(null);
  };

  const handleRecallClick = async (msg) => {
    if (window.confirm("Bạn có chắc chắn muốn thu hồi tin nhắn này không?")) {
      await recallMessage(msg._id);
    }
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    if (msg.isRecalled) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg
    });
  };

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseMenu);
    window.addEventListener("contextmenu", handleCloseMenu);

    const feedEl = feedRef.current;
    if (feedEl) {
      feedEl.addEventListener("scroll", handleCloseMenu);
    }

    return () => {
      window.removeEventListener("click", handleCloseMenu);
      window.removeEventListener("contextmenu", handleCloseMenu);
      if (feedEl) {
        feedEl.removeEventListener("scroll", handleCloseMenu);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
    setReplyingTo(null);
    setEditingMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc đổi hội thoại
  useEffect(() => {
    if (feedRef.current && messages && !chatSearchQuery) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, chatSearchQuery]);

  const formatMessageTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Lọc tin nhắn nếu đang có từ khóa tìm kiếm
  const filteredMessages = chatSearchQuery
    ? messages.filter((message) => message.text && message.text.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : messages;

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const latestPinnedMessage = pinnedMessages[pinnedMessages.length - 1];

  return (
    <div 
      className="chat-container"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{ position: "relative" }}
    >
      {dragActive && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-overlay-text">Thả hình ảnh vào đây để gửi</div>
        </div>
      )}
      <ChatHeader showRightSidebar={showRightSidebar} setShowRightSidebar={setShowRightSidebar} />

      {/* Thanh tìm kiếm tin nhắn trượt xuống */}
      {showChatSearch && (
        <div className="chat-search-bar">
          <Search size={16} className="search-bar-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm tin nhắn trong đoạn chat..."
            className="search-bar-input"
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            autoFocus
          />
          {chatSearchQuery && (
            <button className="search-clear-btn" onClick={() => setChatSearchQuery("")}>
              Xóa
            </button>
          )}
          <button className="search-close-btn" onClick={() => setShowChatSearch(false)}>
            Đóng
          </button>
        </div>
      )}

      {/* Thanh hiển thị tin nhắn đã ghim giống Telegram */}
      {latestPinnedMessage && (
        <div 
          className="pinned-message-banner"
          onClick={() => {
            const el = document.getElementById(`msg-${latestPinnedMessage._id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.classList.add("highlight-pulse");
              setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
            }
          }}
        >
          <div className="pinned-banner-content">
            <Pin size={14} className="pinned-banner-icon" />
            <div className="pinned-banner-text">
              <span className="pinned-label">Tin nhắn đã ghim: </span>
              <span className="pinned-body">
                {latestPinnedMessage.text ? latestPinnedMessage.text : "🖼️ Hình ảnh"}
              </span>
            </div>
          </div>
          <button 
            className="pinned-banner-close"
            onClick={(e) => {
              e.stopPropagation();
              togglePinMessage(latestPinnedMessage._id);
            }}
            title="Bỏ ghim"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="messages-feed" ref={feedRef}>
        {isMessagesLoading ? (
          <div className="messages-loading-wrapper">
            <Loader className="spinner" size={32} />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            {chatSearchQuery ? "Không tìm thấy tin nhắn trùng khớp" : "Bắt đầu cuộc trò chuyện. Hãy gửi lời chào đầu tiên!"}
          </div>
        ) : (
          filteredMessages.map((message) => {
            const isSentByMe = message.sender === authUser._id;

            return (
              <div
                key={message._id}
                id={`msg-${message._id}`}
                className={`message-row ${isSentByMe ? "sent" : "received"} ${message.isPinned ? "is-pinned-row" : ""} ${message.isRecalled ? "is-recalled-row" : ""}`}
              >
                {!isSentByMe && (
                  <img
                    src={selectedUser.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=" + selectedUser.username}
                    alt={selectedUser.username}
                    className="message-avatar"
                  />
                )}
                <div className="message-bubble-wrapper">
                  <div 
                    className={`message-bubble ${message.isRecalled ? "recalled" : ""}`}
                    onDoubleClick={(e) => {
                      if (!message.isRecalled) {
                        handleDoubleClickMessage(e, message._id);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, message)}
                  >
                    {!message.isRecalled && message.replyTo && (
                      <div 
                        className="message-reply-preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          const el = document.getElementById(`msg-${message.replyTo._id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                            el.classList.add("highlight-pulse");
                            setTimeout(() => el.classList.remove("highlight-pulse"), 2000);
                          }
                        }}
                      >
                        <div className="reply-preview-sender">
                          {message.replyTo.sender === authUser._id ? "Bạn" : (message.replyTo.sender?.fullName || selectedUser.fullName)}
                        </div>
                        <div className="reply-preview-text">
                          {message.replyTo.isRecalled ? (
                            <i>Tin nhắn đã bị thu hồi</i>
                          ) : (
                            message.replyTo.text || "🖼️ Hình ảnh"
                          )}
                        </div>
                      </div>
                    )}

                    {message.isRecalled ? (
                      <p className="recalled-text">
                        <i>Tin nhắn đã bị thu hồi</i>
                      </p>
                    ) : (
                      <>
                        {message.text && <p>{message.text}</p>}
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Hình ảnh tin nhắn"
                            className="message-image"
                            onClick={() => window.open(message.image, "_blank")}
                          />
                        )}
                      </>
                    )}

                    <span className="message-time">
                      {formatMessageTime(message.createdAt)}
                      {!message.isRecalled && message.isEdited && (
                        <span className="edited-indicator"> (đã chỉnh sửa)</span>
                      )}
                      {!message.isRecalled && message.isPinned && (
                        <Pin size={10} className="bubble-pinned-icon" />
                      )}
                    </span>
                    {!message.isRecalled && likes[message._id] && (
                      <div 
                        className="bubble-heart-badge" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(message._id);
                        }}
                      >
                        <span className="bubble-heart-icon">❤️</span>
                      </div>
                    )}
                  </div>

                  {/* Thanh hover thao tác tin nhắn (Chỉ hiển thị nút Reply ở ngoài) */}
                  {!message.isRecalled && (
                    <div className={`message-hover-actions ${isSentByMe ? "left" : "right"}`}>
                      <button
                        className="message-action-btn"
                        onClick={() => handleReplyClick(message)}
                        title="Trả lời"
                      >
                        <Reply size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageInput 
        replyingTo={replyingTo} 
        setReplyingTo={setReplyingTo}
        editingMessage={editingMessage}
        setEditingMessage={setEditingMessage}
      />

      {/* Menu ngữ cảnh chuột phải */}
      {contextMenu && (
        <div 
          className="chat-context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="context-menu-item"
            onClick={() => {
              handleReplyClick(contextMenu.message);
              setContextMenu(null);
            }}
          >
            <Reply size={14} />
            <span>Trả lời</span>
          </button>
          
          {!contextMenu.message.isRecalled && contextMenu.message.text && (
            <button 
              className="context-menu-item"
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.message.text);
                setContextMenu(null);
              }}
            >
              <Copy size={14} />
              <span>Sao chép tin nhắn</span>
            </button>
          )}

          <button 
            className="context-menu-item"
            onClick={() => {
              togglePinMessage(contextMenu.message._id);
              setContextMenu(null);
            }}
          >
            <Pin size={14} style={{ transform: contextMenu.message.isPinned ? "rotate(0deg)" : "rotate(45deg)" }} />
            <span>{contextMenu.message.isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}</span>
          </button>
          
          {contextMenu.message.sender === authUser._id && contextMenu.message.text && (
            <button 
              className="context-menu-item"
              onClick={() => {
                handleEditClick(contextMenu.message);
                setContextMenu(null);
              }}
            >
              <Pencil size={14} />
              <span>Chỉnh sửa</span>
            </button>
          )}
          
          {contextMenu.message.sender === authUser._id && (
            <button 
              className="context-menu-item recall-btn"
              onClick={() => {
                handleRecallClick(contextMenu.message);
                setContextMenu(null);
              }}
            >
              <Trash2 size={14} />
              <span>Thu hồi</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
