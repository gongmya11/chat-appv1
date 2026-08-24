import { useState, useRef, useEffect } from "react";
import { Image, Send, X, PlusCircle, Paperclip, Reply, Pencil } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

const MessageInput = ({ 
  replyingTo, 
  setReplyingTo, 
  editingMessage, 
  setEditingMessage 
}) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, editMessage, selectedUser } = useChat();
  const { authUser } = useAuth();

  useEffect(() => {
    const handleAttachImage = (e) => {
      if (e.detail) {
        setImagePreview(e.detail);
      }
    };
    window.dispatchEvent(new Event("attach-image-reset")); // Reset any older input reference if needed
    window.addEventListener("attach-image", handleAttachImage);
    return () => window.removeEventListener("attach-image", handleAttachImage);
  }, []);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
    } else {
      setText("");
    }
  }, [editingMessage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn hình ảnh!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      if (editingMessage) {
        await editMessage(editingMessage._id, text.trim());
        setEditingMessage(null);
        setText("");
      } else {
        const payload = {
          text: text.trim(),
          image: imagePreview,
        };
        if (replyingTo) {
          payload.replyTo = replyingTo._id;
        }
        await sendMessage(payload);
        if (replyingTo) {
          setReplyingTo(null);
        }
        setText("");
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Lỗi khi gửi/chỉnh sửa tin nhắn:", error.message);
    }
  };

  return (
    <div className="message-input-form">
      {/* Reply Preview Banner */}
      {replyingTo && (
        <div className="input-reply-banner">
          <div className="reply-banner-icon">
            <Reply size={14} />
          </div>
          <div className="reply-banner-content">
            <div className="reply-banner-sender">
              Đang trả lời {replyingTo.sender === authUser._id ? "chính mình" : (replyingTo.sender?.fullName || selectedUser.fullName)}
            </div>
            <div className="reply-banner-text">
              {replyingTo.isRecalled ? <i>Tin nhắn đã bị thu hồi</i> : replyingTo.text || "🖼️ Hình ảnh"}
            </div>
          </div>
          <button 
            type="button" 
            className="reply-banner-close" 
            onClick={() => setReplyingTo(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Edit Mode Banner */}
      {editingMessage && (
        <div className="input-edit-banner">
          <div className="edit-banner-icon">
            <Pencil size={14} />
          </div>
          <div className="edit-banner-content">
            <div className="edit-banner-label">
              Chỉnh sửa tin nhắn
            </div>
            <div className="edit-banner-text">
              {editingMessage.text}
            </div>
          </div>
          <button 
            type="button" 
            className="edit-banner-close" 
            onClick={() => setEditingMessage(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Xem trước" className="preview-image" />
          <button type="button" onClick={removeImage} className="remove-preview-btn">
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="input-container">
        {/* Thanh nhập văn bản tích hợp kiểu Telegram */}
        <div className="message-text-input-wrapper">
          <button
            type="button"
            className="input-action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Đính kèm hình ảnh"
            style={{ padding: "4px", width: "28px", height: "28px" }}
          >
            <Image size={18} />
          </button>

          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <input
            type="text"
            className="message-text-input"
            placeholder="Nhập tin nhắn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Nút gửi hình tròn bên phải */}
        <button
          type="submit"
          className="send-btn"
          disabled={!text.trim() && !imagePreview}
          title="Gửi"
        >
          <Send size={18} style={{ transform: "translateX(1px)" }} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
