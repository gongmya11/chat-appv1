const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { getReceiverSocketId, io } = require("../lib/socket");

// Lấy danh sách tất cả bạn bè cho sidebar
const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    // Tìm user hiện tại và populate danh sách bạn bè
    const user = await User.findById(loggedInUserId).populate("friends", "-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const friendsWithDetails = await Promise.all(
      user.friends.map(async (friend) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUserId, friend._id] },
        });

        let lastMessage = null;
        let unreadCount = 0;

        if (conversation) {
          if (conversation.lastMessage) {
            lastMessage = await Message.findById(conversation.lastMessage).populate("replyTo");
          }
          unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            sender: friend._id,
            isRead: false,
          });
        }

        return {
          ...friend.toObject(),
          lastMessage,
          unreadCount,
        };
      })
    );

    res.status(200).json(friendsWithDetails);
  } catch (error) {
    console.error("Lỗi trong getUsersForSidebar controller:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Lấy tin nhắn giữa user hiện tại và user khác
const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Tìm cuộc trò chuyện chứa cả 2 thành viên
    const conversation = await Conversation.findOne({
      participants: { $all: [myId, userToChatId] },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .populate({
        path: "replyTo",
        select: "text image sender isRecalled",
        populate: {
          path: "sender",
          select: "fullName profilePic"
        }
      })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi trong getMessages controller:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const generateBotReply = (botUsername, userMessageText) => {
  const msg = (userMessageText || "").toLowerCase();
  
  if (botUsername === "BiliChan") {
    if (msg.includes("hello") || msg.includes("chào") || msg.includes("hi")) {
      return "Konnichiwa! Bili-chan chào bạn nha~ Chúc bạn một ngày tràn đầy năng lượng! 🌸✨";
    }
    if (msg.includes("mật khẩu") || msg.includes("pass") || msg.includes("f12")) {
      return "Úi da! Đừng nhắc đến F12 nữa mà, Bili-chan ngại ngùng lắm nên mới phải che mắt lại đó~ 🙈💦";
    }
    if (msg.includes("yêu") || msg.includes("thích")) {
      return "Bili-chan cũng thích trò chuyện với bạn lắm á! Moa moa~ 💕";
    }
    const randomReplies = [
      "Bạn đang làm gì thế? Có muốn xem anime cùng Bili-chan không nè? 📺",
      "Hôm nay bạn thế nào? Nhớ uống đủ nước và giữ sức khỏe nha! 🥤🌸",
      "Bili-chan luôn sẵn sàng lắng nghe tâm sự của bạn đấy! Trút bầu tâm sự đi nào~ 🥰",
      "Ái chà, bạn nhắn tin nhanh thật đó! Chờ Bili-chan một chút xíu nha~ ⚡"
    ];
    return randomReplies[Math.floor(Math.random() * randomReplies.length)];
  }

  if (botUsername === "MyaBot") {
    if (msg.includes("help") || msg.includes("giúp") || msg.includes("chức năng")) {
      return "🤖 [Mya Assistant] Các chức năng hỗ trợ:\n1. Gửi tin nhắn văn bản / hình ảnh.\n2. Thả tim tin nhắn (đúp chuột).\n3. Ghim tin nhắn lên đầu đoạn chat.\n4. Thu hồi hoặc chỉnh sửa tin nhắn.";
    }
    return "🤖 [Hệ thống Mya Bot] Đã nhận thông điệp của bạn. Trạng thái kết nối của bạn: Hoạt động ổn định. Để xem trợ giúp, hãy gõ 'help' hoặc 'giúp'.";
  }

  if (botUsername === "KaitoKid") {
    if (msg.includes("ảo thuật") || msg.includes("magic") || msg.includes("trò")) {
      return "🃏 Một ảo thuật gia đích thực sẽ không bao giờ tiết lộ bí mật của mình! Nhưng tôi có thể gửi cho bạn một đóa hồng ảo thuật~ 🌹✨";
    }
    const kidReplies = [
      "Siêu trộm Kid đã nhận được thư khiêu chiến của bạn. Tôi sẽ đánh cắp trái tim của bạn vào đêm nay! 🌌🃏",
      "Gặp gỡ dưới ánh trăng luôn là thời điểm lãng mạn nhất để bắt đầu một màn ảo thuật. 🎩",
      "Con người thường bị đánh lừa bởi những gì mắt họ nhìn thấy. Hãy cẩn thận đấy! 👀🃏"
    ];
    return kidReplies[Math.floor(Math.random() * kidReplies.length)];
  }

  if (botUsername === "AliceWonder") {
    if (msg.includes("thỏ") || msg.includes("rabbit")) {
      return "🐰 Ôi không! Anh Thỏ Trắng lại trễ giờ rồi! Tôi phải đuổi theo anh ấy đây, hẹn gặp lại bạn sau nhé! ⏰⚡";
    }
    const aliceReplies = [
      "Nơi này thật kỳ lạ... Mọi thứ cứ đổi kích thước liên tục. Bạn có biết đường ra khỏi xứ sở này không? 🍄🚪",
      "Chào bạn! Bạn có muốn uống trà chiều cùng tôi và người làm mũ Điên Hatter không? ☕🍰",
      "Đôi khi tôi tin vào 6 điều không tưởng trước khi ăn sáng đấy! 🌟"
    ];
    return aliceReplies[Math.floor(Math.random() * aliceReplies.length)];
  }

  if (botUsername === "SonGoku") {
    if (msg.includes("mạnh") || msg.includes("luyện") || msg.includes("đấm")) {
      return "🔥 Tuyệt vời! Hãy cùng nhau vào Phòng Tập Thời Gian để rèn luyện và vượt qua giới hạn của bản thân nào! Ka-me-ha-me-ha!!! 💥";
    }
    const gokuReplies = [
      "Chào bạn! Tớ là Goku đây. Hôm nay tớ vừa tập luyện xong, đói bụng quá đi thôi! 🍖🍚",
      "Đối thủ mạnh nhất của chúng ta chính là bản thân của ngày hôm qua. Hãy cố gắng lên nhé! 💪⚡",
      "Chào nhé! Cậu có muốn cùng tớ đi tìm ngọc rồng không? Tớ có mang theo Rada dò tìm đây! 🐉🔮"
    ];
    return gokuReplies[Math.floor(Math.random() * gokuReplies.length)];
  }

  return `Chào bạn! Mình là ${botUsername}. Rất vui được nhắn tin với bạn! 😊`;
};

// Gửi tin nhắn mới
const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Tìm xem cuộc trò chuyện đã tồn tại chưa
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // Nếu chưa tồn tại thì tạo mới
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
      await conversation.save();
    }

    // Tạo tin nhắn mới
    const newMessage = new Message({
      sender: senderId,
      conversationId: conversation._id,
      text,
      image,
      replyTo: replyTo || null,
    });

    // Cập nhật tin nhắn cuối cùng của cuộc hội thoại
    conversation.lastMessage = newMessage._id;

    // Lưu đồng thời tin nhắn và cuộc trò chuyện để tối ưu
    await Promise.all([newMessage.save(), conversation.save()]);

    // Populate replyTo
    await newMessage.populate({
      path: "replyTo",
      select: "text image sender isRecalled",
      populate: {
        path: "sender",
        select: "fullName profilePic"
      }
    });

    // Gửi sự kiện thời gian thực bằng Socket.io đến người nhận nếu họ đang online
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // TỰ ĐỘNG PHẢN HỒI NẾU NGƯỜI NHẬN LÀ BOT
    const receiver = await User.findById(receiverId);
    const botEmails = ["bilichan@bilibili.com", "myabot@mya.app", "kaitokid@detective.com", "alice@wonderland.com", "goku@saiyan.com"];
    const isBot = receiver && botEmails.includes(receiver.email);

    if (isBot) {
      setTimeout(async () => {
        try {
          const replyText = generateBotReply(receiver.username, text);
          
          // Tạo tin nhắn phản hồi của Bot
          const replyMessage = new Message({
            sender: receiverId, // người gửi là Bot
            conversationId: conversation._id,
            text: replyText,
            image: "",
            replyTo: null
          });
          
          // Cập nhật lastMessage của conversation
          conversation.lastMessage = replyMessage._id;
          
          await Promise.all([replyMessage.save(), conversation.save()]);
          
          // Gửi socket tin nhắn phản hồi tới User
          const userSocketId = getReceiverSocketId(senderId.toString());
          if (userSocketId) {
            io.to(userSocketId).emit("newMessage", replyMessage);
          }
        } catch (err) {
          console.error("Lỗi khi bot phản hồi tự động:", err.message);
        }
      }, 1200); // 1.2s delay
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Lỗi trong sendMessage controller:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Ghim hoặc bỏ ghim tin nhắn
const togglePinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    // Tìm cuộc hội thoại để gửi socket event thông báo cho người nhận
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const receiverId = conversation.participants.find(
        (p) => p.toString() !== myId.toString()
      );
      if (receiverId) {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messagePinned", {
            messageId,
            isPinned: message.isPinned,
            message,
          });
        }
      }
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Lỗi trong togglePinMessage:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Chỉnh sửa tin nhắn
const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    if (message.sender.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tin nhắn này" });
    }

    if (message.isRecalled) {
      return res.status(400).json({ message: "Không thể chỉnh sửa tin nhắn đã bị thu hồi" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    // Populate replyTo if exists
    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        select: "text image sender isRecalled",
        populate: {
          path: "sender",
          select: "fullName profilePic"
        }
      });
    }

    // Gửi sự kiện Socket.io đến người nhận
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const receiverId = conversation.participants.find(
        (p) => p.toString() !== myId.toString()
      );
      if (receiverId) {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageEdited", message);
        }
      }
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Lỗi trong editMessage controller:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Thu hồi tin nhắn
const recallMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    if (message.sender.toString() !== myId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    message.text = "";
    message.image = "";
    message.isRecalled = true;
    message.isPinned = false;
    await message.save();

    // Gửi sự kiện Socket.io đến người nhận
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const receiverId = conversation.participants.find(
        (p) => p.toString() !== myId.toString()
      );
      if (receiverId) {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageRecalled", { messageId });
        }
      }
    }

    res.status(200).json({ messageId });
  } catch (error) {
    console.error("Lỗi trong recallMessage controller:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Đánh dấu đã đọc tất cả tin nhắn từ người gửi cụ thể
const markAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const myId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [myId, senderId] },
    });

    if (!conversation) {
      return res.status(200).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    await Message.updateMany(
      {
        conversationId: conversation._id,
        sender: senderId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.status(200).json({ success: true, message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    console.error("Lỗi trong markAsRead controller:", error.message);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  togglePinMessage,
  editMessage,
  recallMessage,
  markAsRead,
};
