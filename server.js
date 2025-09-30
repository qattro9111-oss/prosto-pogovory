const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Підключення до MongoDB
const mongoURI = process.env.MONGO_URI; // змінна середовища в Render
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Схема повідомлень
const messageSchema = new mongoose.Schema({
  from: String,   // "user" або "admin"
  text: String,   // текст повідомлення
  time: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Віддаємо статичні файли (index.html, admin.html)
app.use(express.static(path.join(__dirname, "public")));

// WebSocket логіка
io.on("connection", async (socket) => {
  console.log("🔗 Новий клієнт підключився");

  // При підключенні — відправляємо історію останніх 50 повідомлень
  const history = await Message.find().sort({ time: 1 }).limit(50);
  socket.emit("chat history", history);

  // Отримання нового повідомлення
  socket.on("chat message", async (data) => {
    const newMsg = new Message(data);
    await newMsg.save();

    io.emit("chat message", {
      from: data.from,
      text: data.text,
      time: newMsg.time
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Клієнт відключився");
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порту ${PORT}`);
});
