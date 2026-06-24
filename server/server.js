const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

const players = {};

io.on("connection", (socket) => {
  console.log("Player joined:", socket.id);

  players[socket.id] = {
  x: 400,
  y: 300,
  angle: 0,
  hp: 1000,
  name: "Player"
};
  io.emit("players", players);

  socket.on("updatePlayer", (data) => {
  if (players[socket.id]) {
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].angle = data.angle;
    players[socket.id].name = data.name;
    players[socket.id].hp = data.hp;

    io.emit("players", players);
  }
});

socket.on("shoot", (bullet) => {
  socket.broadcast.emit("shoot", bullet);
});
socket.on("hitPlayer", (targetId) => {
  if (!players[targetId]) return;

  players[targetId].hp -= 250;

  if (players[targetId].hp <= 0) {
    players[targetId].hp = 1000;
    players[targetId].x = 400;
    players[targetId].y = 300;
  }

  io.emit("players", players);
});
  socket.on("disconnect", () => {
  console.log("Player left:", socket.id);

  delete players[socket.id];

  io.emit("players", players);
});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

