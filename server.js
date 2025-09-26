const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

let users = {}; // список користувачів

io.on("connection", (socket) => {
  console.log("Користувач підключився:", socket.id);

  // додаємо користувача
  users[socket.id] = { id: socket.id };
  io.emit("users", Object.values(users)); // повідомляємо адміна

  // повідомлення від користувача
  socket.on("chat message", (msg) => {
    io.emit("chat message", { from: "user", text: msg, id: socket.id });
  });

  // повідомлення від адміна конкретному юзеру
  socket.on("admin message", (data) => {
    io.to(data.id).emit("chat message", { from: "admin", text: data.text });
  });

  socket.on("disconnect", () => {
    console.log("Користувач відключився:", socket.id);
    delete users[socket.id];
    io.emit("users", Object.values(users)); // оновлюємо список
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
