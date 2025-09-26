const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let adminSocket = null;

// коли хтось підключається
io.on("connection", (socket) => {
  console.log("Новий користувач підключився:", socket.id);

  // якщо це адмін
  socket.on("admin connected", () => {
    adminSocket = socket;
    console.log("Адмін підключився:", socket.id);
  });

  // повідомлення від користувача → адміна
  socket.on("chat message", (msg) => {
    console.log("Від користувача:", msg);
    if (adminSocket) {
      adminSocket.emit("user message", msg);
    }
  });

  // повідомлення від адміна → всіх користувачів
  socket.on("admin message", (msg) => {
    console.log("Від адміна:", msg);
    socket.broadcast.emit("chat message", msg); // відправити всім, крім адміна
  });

  // коли відключився
  socket.on("disconnect", () => {
    if (socket === adminSocket) {
      console.log("Адмін відключився");
      adminSocket = null;
    } else {
      console.log("Користувач відключився:", socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
