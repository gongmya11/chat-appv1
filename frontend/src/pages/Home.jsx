import { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import DetailsSidebar from "../components/DetailsSidebar";

const Home = () => {
  const { selectedUser, chatThemes } = useChat();
  const [showRightSidebar, setShowRightSidebar] = useState(typeof window !== "undefined" ? window.innerWidth > 768 : true);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  // Tự động tắt tìm kiếm khi chuyển sang trò chuyện với người khác
  useEffect(() => {
    setShowChatSearch(false);
    setChatSearchQuery("");
    // Mặc định ẩn sidebar thông tin trên mobile để không che màn hình chat
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setShowRightSidebar(false);
    }
  }, [selectedUser?._id]);

  return (
    <div className={`chat-app-window ${selectedUser ? "has-selected-user" : "no-selected-user"}`}>
      <Sidebar />
      {selectedUser ? (
        <div className="chat-active-area">
          <ChatContainer 
            showRightSidebar={showRightSidebar} 
            setShowRightSidebar={setShowRightSidebar}
            showChatSearch={showChatSearch}
            setShowChatSearch={setShowChatSearch}
            chatSearchQuery={chatSearchQuery}
            setChatSearchQuery={setChatSearchQuery}
          />
          {showRightSidebar && (
            <DetailsSidebar 
              user={selectedUser} 
              showChatSearch={showChatSearch}
              setShowChatSearch={setShowChatSearch}
              setShowRightSidebar={setShowRightSidebar}
            />
          )}
        </div>
      ) : (
        <NoChatSelected />
      )}
    </div>
  );
};

export default Home;
