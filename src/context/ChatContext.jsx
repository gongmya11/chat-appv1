import { createContext, useContext, useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const { socket } = useAuth();

  // Phát âm thanh thông báo "ping" bằng Web Audio API
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // 600Hz frequency
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime); // Low volume
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); // Beep duration 120ms
    } catch (err) {
      console.log("Audio play blocked by browser:", err.message);
    }
  };

  const getUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await axiosInstance.get("/messages/users");
      setUsers(res.data);
    } catch (error) {
      console.log("Error in getUsers:", error.message);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const markAsRead = async (userId) => {
    try {
      await axiosInstance.put(`/messages/read/${userId}`);
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, unreadCount: 0 } : u
        )
      );
    } catch (error) {
      console.log("Error in markAsRead:", error.message);
    }
  };

  const getMessages = async (userId) => {
    setIsMessagesLoading(true);
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      setMessages(res.data);
      await markAsRead(userId);
    } catch (error) {
      console.log("Error in getMessages:", error.message);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      setMessages((prevMessages) => [...prevMessages, res.data]);
      
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === selectedUser._id ? { ...u, lastMessage: res.data } : u
        )
      );

      return { success: true };
    } catch (error) {
      console.log("Error in sendMessage:", error.message);
      return { success: false, message: error.response?.data?.message || "Lỗi khi gửi tin nhắn" };
    }
  };

  const togglePinMessage = async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/pin/${messageId}`);
      setMessages((prevMessages) =>
        prevMessages.map((m) => (m._id === messageId ? { ...m, isPinned: res.data.isPinned } : m))
      );
      return { success: true };
    } catch (error) {
      console.log("Error in togglePinMessage:", error.message);
      return { success: false };
    }
  };

  const editMessage = async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      setMessages((prevMessages) =>
        prevMessages.map((m) => (m._id === messageId ? res.data : m))
      );
      return { success: true };
    } catch (error) {
      console.log("Error in editMessage:", error.message);
      return { success: false, message: error.response?.data?.message || "Lỗi khi chỉnh sửa tin nhắn" };
    }
  };

  const recallMessage = async (messageId) => {
    try {
      await axiosInstance.put(`/messages/recall/${messageId}`);
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m._id === messageId ? { ...m, text: "", image: "", isRecalled: true, isPinned: false } : m
        )
      );
      return { success: true };
    } catch (error) {
      console.log("Error in recallMessage:", error.message);
      return { success: false, message: error.response?.data?.message || "Lỗi khi thu hồi tin nhắn" };
    }
  };

  // Lắng nghe tin nhắn và thông báo thông qua Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      // Chỉ tự động thêm tin nhắn vào feed nếu tin nhắn đến từ người dùng đang được chọn để chat cùng
      if (selectedUser && newMessage.sender === selectedUser._id) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        markAsRead(selectedUser._id);
      } else {
        // Tăng unreadCount và cập nhật lastMessage cục bộ cho người gửi trong sidebar
        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u._id === newMessage.sender) {
              const currentUnread = u.unreadCount || 0;
              return {
                ...u,
                unreadCount: currentUnread + 1,
                lastMessage: newMessage,
              };
            }
            return u;
          })
        );
      }
      
      // Chỉ phát âm thanh khi người dùng này không bị tắt thông báo
      const mutedUsers = JSON.parse(localStorage.getItem("mutedUsers") || "[]");
      if (!mutedUsers.includes(newMessage.sender)) {
        playNotificationSound();
      }
    });

    socket.on("messagePinned", ({ messageId, isPinned }) => {
      setMessages((prevMessages) =>
        prevMessages.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
      );
    });

    socket.on("messageEdited", (updatedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
      // Cập nhật preview tin nhắn cuối cùng nếu tin nhắn đó bị sửa
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.lastMessage && u.lastMessage._id === updatedMessage._id) {
            return { ...u, lastMessage: updatedMessage };
          }
          return u;
        })
      );
    });

    socket.on("messageRecalled", ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m._id === messageId ? { ...m, text: "", image: "", isRecalled: true, isPinned: false } : m
        )
      );
      // Cập nhật preview tin nhắn cuối cùng nếu tin nhắn đó bị thu hồi
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.lastMessage && u.lastMessage._id === messageId) {
            return {
              ...u,
              lastMessage: { ...u.lastMessage, text: "", image: "", isRecalled: true },
            };
          }
          return u;
        })
      );
    });

    socket.on("new_notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadNotificationsCount((prev) => prev + 1);
      playNotificationSound();
    });

    socket.on("friend_updated", () => {
      getUsers();
    });

    return () => {
      socket.off("newMessage");
      socket.off("messagePinned");
      socket.off("messageEdited");
      socket.off("messageRecalled");
      socket.off("new_notification");
      socket.off("friend_updated");
    };
  }, [socket, selectedUser]);

  const [chatThemes, setChatThemes] = useState({});

  useEffect(() => {
    try {
      const savedThemes = JSON.parse(localStorage.getItem("chat-themes") || "{}");
      setChatThemes(savedThemes);
    } catch (e) {
      console.log("Error loading chat themes:", e);
    }
  }, []);

  const changeChatTheme = (userId, theme) => {
    const updated = { ...chatThemes, [userId]: theme };
    setChatThemes(updated);
    localStorage.setItem("chat-themes", JSON.stringify(updated));
  };

  const getNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      setNotifications(res.data);
      setUnreadNotificationsCount(res.data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.log("Error in getNotifications:", error.message);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.log("Error in markNotificationAsRead:", error.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axiosInstance.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.log("Error in markAllNotificationsAsRead:", error.message);
    }
  };

  const clearNotifications = async () => {
    try {
      await axiosInstance.delete("/notifications/clear");
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.log("Error in clearNotifications:", error.message);
    }
  };

  const searchFriends = async (query) => {
    try {
      const res = await axiosInstance.get(`/friends/search?query=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      console.log("Error in searchFriends:", error.message);
      return [];
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      return { success: true, message: res.data.message };
    } catch (error) {
      console.log("Error in sendFriendRequest:", error.message);
      return { success: false, message: error.response?.data?.message || "Không thể gửi yêu cầu kết bạn" };
    }
  };

  const acceptFriendRequest = async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/accept/${userId}`);
      getUsers();
      getNotifications();
      return { success: true, message: res.data.message };
    } catch (error) {
      console.log("Error in acceptFriendRequest:", error.message);
      return { success: false, message: error.response?.data?.message || "Không thể chấp nhận yêu cầu" };
    }
  };

  const declineFriendRequest = async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/decline/${userId}`);
      getNotifications();
      return { success: true, message: res.data.message };
    } catch (error) {
      console.log("Error in declineFriendRequest:", error.message);
      return { success: false, message: error.response?.data?.message || "Không thể từ chối yêu cầu" };
    }
  };

  const unfriend = async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/unfriend/${userId}`);
      getUsers();
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(null);
      }
      return { success: true, message: res.data.message };
    } catch (error) {
      console.log("Error in unfriend:", error.message);
      return { success: false, message: error.response?.data?.message || "Không thể hủy kết bạn" };
    }
  };

  const getUserProfile = async (userId) => {
    try {
      const res = await axiosInstance.get(`/friends/profile/${userId}`);
      return res.data;
    } catch (error) {
      console.log("Error in getUserProfile:", error.message);
      return null;
    }
  };

  // Fetch notifications on socket (auth) change
  useEffect(() => {
    if (!socket) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }
    getNotifications();
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        users,
        selectedUser,
        isUsersLoading,
        isMessagesLoading,
        getUsers,
        getMessages,
        sendMessage,
        togglePinMessage,
        editMessage,
        recallMessage,
        setSelectedUser,
        chatThemes,
        changeChatTheme,
        markAsRead,
        notifications,
        unreadNotificationsCount,
        getNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        searchFriends,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        unfriend,
        getUserProfile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
