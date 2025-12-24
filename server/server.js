const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Broadcast to all other clients that a new player joined
  socket.broadcast.emit('playerJoined', socket.id);

  // Send current players to the new player
  const currentPlayers = Object.keys(io.sockets.sockets).filter(id => id !== socket.id);
  currentPlayers.forEach(playerId => {
    socket.emit('playerJoined', playerId);
  });

  // Handle position updates from clients
  socket.on('updatePosition', (data) => {
    // Broadcast the position update to all other clients
    socket.broadcast.emit('playerUpdate', {
      id: socket.id,
      position: data.position,
      rotation: data.rotation,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Broadcast to all other clients that a player left
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
