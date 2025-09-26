const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let adminSocket = null;
let users = {}; // збережемо користувачів {id: socket}

io.on("connection", (socket) => {
  console.log("Новий користувач:", socket.id);

  // якщо це адмін
  socket.on("admin connected", () => {
    adminSocket = socket;
    console.log("Адмін підключився:", socket.id);
  });

  // звичайний користувач
  users[socket.id] = socket;

  // повідомлення від користувача → адміну
  socket.on("chat message", (msg) => {
    console.log(`Від ${socket.id}: ${msg}`);
    if (adminSocket) {
      adminSocket.emit("user message", {
        id: socket.id,
        text: msg
      });
    }
  });

  // повідомлення від адміна → конкретному користувачу
  socket.on("admin message", (data) => {
    const { id, text } = data;
    console.log(`Адмін → ${id}: ${text}`);
    if (users[id]) {
      users[id].emit("chat message", text);
    }
  });

  // відключення
  socket.on("disconnect", () => {
    console.log("Відключився:", socket.id);
    delete users[socket.id];
    if (adminSocket) {
      adminSocket.emit("user disconnected", socket.id);
    }
    if (socket === adminSocket) {
      adminSocket = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
