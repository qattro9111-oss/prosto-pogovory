const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { MongoClient } = require("mongodb");

app.use(express.static("public"));

let users = {};
let counter = 1;

// 🔹 Підключення до MongoDB
const uri = process.env.MONGO_URI; // у Render додаси в Environment
const client = new MongoClient(uri);
let messagesCollection;

async function initDB() {
  await client.connect();
  const db = client.db("chatDB"); // назва бази
  messagesCollection = db.collection("messages"); // колекція
  console.log("✅ Підключено до MongoDB");
}
initDB();

// 🔹 Socket.io логіка
io.on("connection", async (socket) => {
  const username = "Користувач " + counter++;
  users[socket.id] = { id: socket.id, name: username };

  io.emit("users", Object.values(users));

  // Надсилаємо стару історію юзеру
  const history = await messagesCollection.find({ id: socket.id }).toArray();
  history.forEach(msg => {
    socket.emit("chat message", msg);
  });

  // Повідомлення від юзера
  socket.on("chat message", async (msg) => {
    const message = { from: "user", text: msg, id: socket.id, name: username };
    await messagesCollection.insertOne(message);
    io.emit("chat message", message);
  });

  // Повідомлення від адміна
  socket.on("admin message", async (data) => {
    const message = { from: "admin", text: data.text, id: data.id, name: "Адмін" };
    await messagesCollection.insertOne(message);
    io.to(data.id).emit("chat message", message);
    socket.emit("chat message", message); // щоб у адміна теж було видно
  });

  // Відключення
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
