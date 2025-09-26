const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

app.use(express.static(path.join(__dirname, "public")));

// захищена віддача admin.html — тільки якщо token в query співпадає
app.get("/admin.html", (req, res) => {
  const token = req.query.token || "";
  if (token === ADMIN_TOKEN) {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
  } else {
    res.status(403).send("Forbidden");
  }
});

let adminSocket = null;
let users = {}; // {socketId: socket}

io.on("connection", (socket) => {
  // Якщо підключення надходить з admin (через auth)
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (token && token === ADMIN_TOKEN) {
    adminSocket = socket;
    console.log("Адмін підключився:", socket.id);
    // Можеш пересилати адміну номер користувачів тощо
    socket.on("disconnect", () => { adminSocket = null; });
    return;
  }

  // звичайний користувач
  users[socket.id] = socket;
  console.log("Користувач підключився:", socket.id);

  socket.on("chat message", (msg) => {
    if (adminSocket) {
      adminSocket.emit("user message", { id: socket.id, text: msg });
    }
  });

  socket.on("admin message", (data) => {
    // це не використовується звичайним юзером — тільки адмін надсилає на UI з auth
    const { id, text } = data;
    if (users[id]) users[id].emit("chat message", text);
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    if (adminSocket) adminSocket.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
