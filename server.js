const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

// Твій секретний токен для адміна
const ADMIN_TOKEN = "MY_SECRET_TOKEN";

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("Користувач підключився");

  // Повідомлення від користувача
  socket.on("chat message", (msg) => {
    io.emit("chat message", { from: "user", text: msg });
  });

  // Повідомлення від адміна
  socket.on("admin message", (msg) => {
    io.emit("chat message", { from: "admin", text: msg });
  });

  socket.on("disconnect", () => {
    console.log("Користувач відключився");
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
