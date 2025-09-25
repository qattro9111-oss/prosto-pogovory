import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let clients = {}; // {id: ws}
let admin = null;
let idCounter = 1;

wss.on("connection", (ws, req) => {
  const isAdmin = req.url.includes("admin");
  if (isAdmin) {
    admin = ws;
    console.log("Admin connected");
    ws.on("close", () => { admin = null; });
    return;
  }

  const id = idCounter++;
  clients[id] = ws;
  console.log("User connected", id);

  ws.send(JSON.stringify({ type: "system", message: "Ви підключились. Очікуйте відповіді." }));
  if (admin) admin.send(JSON.stringify({ type: "new_user", id }));

  ws.on("message", (msg) => {
    if (admin) admin.send(JSON.stringify({ type: "message", id, text: msg.toString() }));
  });

  ws.on("close", () => {
    delete clients[id];
    if (admin) admin.send(JSON.stringify({ type: "user_left", id }));
  });
});

app.use(express.static(path.join(__dirname, "public")));

server.listen(3000, () => {
  console.log("Сервер запущений на порті 3000");
});
