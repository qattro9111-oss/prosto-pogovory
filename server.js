const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let users = {};
let counter = 1; // лічильник користувачів

io.on("connection", (socket) => {
  const username = "Користувач " + counter++;
  users[socket.id] = { id: socket.id, name: username };

  // надсилаємо список користувачів адміну
  io.emit("users", Object.values(users));

  // коли юзер пише повідомлення
  socket.on("chat message", (msg) => {
    io.emit("chat message", { from: "user", text: msg, id: socket.id, name: username });
  });

  // коли адмін пише конкретному користувачу
  socket.on("admin message", (data) => {
    io.to(data.id).emit("chat message", { from: "admin", text: data.text });
  });

  // відключення користувача
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
