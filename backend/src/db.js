const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedMockUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    // Nếu trong db có ít hơn 5 người dùng, tiến hành seed thêm tài khoản mẫu
    if (userCount < 5) {
      console.log("Đang khởi tạo danh sách người dùng mẫu (seeding)...");
      const defaultPasswordHash = await bcrypt.hash("123123aa", 10);
      
      const mockUsers = [
        {
          username: "BiliChan",
          email: "bilichan@bilibili.com",
          password: defaultPasswordHash,
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=BiliChan",
          bio: "Chào bạn! Mình là trợ lý Bili-chan siêu cấp đáng yêu đây~ 🌸",
          gender: "Nữ",
          dob: "2009-06-26",
          phone: "0901234567"
        },
        {
          username: "MyaBot",
          email: "myabot@mya.app",
          password: defaultPasswordHash,
          avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=MyaBot",
          bio: "🤖 Robot hỗ trợ hệ thống Mya App. Sẵn sàng trợ giúp 24/7!",
          gender: "Khác",
          dob: "2026-01-01",
          phone: "0900000000"
        },
        {
          username: "KaitoKid",
          email: "kaitokid@detective.com",
          password: defaultPasswordHash,
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=KaitoKid",
          bio: "🃏 Siêu trộm ảo thuật gia dưới ánh trăng. Chúc bạn một ngày vui vẻ!",
          gender: "Nam",
          dob: "1997-06-21",
          phone: "0987654321"
        },
        {
          username: "AliceWonder",
          email: "alice@wonderland.com",
          password: defaultPasswordHash,
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alice",
          bio: "🐰 Đang phiêu lưu ở Xứ sở Thần tiên. Có ai muốn đi cùng không?",
          gender: "Nữ",
          dob: "1865-07-04"
        },
        {
          username: "SonGoku",
          email: "goku@saiyan.com",
          password: defaultPasswordHash,
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Goku",
          bio: "🔥 Xin chào, tớ là Goku! Hãy cùng nhau trở nên mạnh mẽ hơn nhé!",
          gender: "Nam",
          dob: "1984-11-20"
        }
      ];

      for (const u of mockUsers) {
        // Kiểm tra xem username hoặc email đã tồn tại chưa để tránh trùng lặp
        const exists = await User.findOne({
          $or: [{ username: u.username }, { email: u.email }]
        });
        if (!exists) {
          await User.create(u);
          console.log(`Đã tạo người dùng mẫu: ${u.username}`);
        }
      }
      console.log("Khởi tạo danh sách người dùng mẫu thành công!");
    }
  } catch (error) {
    console.error("Lỗi khi seed người dùng mẫu:", error.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Kết nối MongoDB thành công");
    await seedMockUsers();
  } catch (error) {
    console.error("Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
