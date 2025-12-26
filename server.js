import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import SpawnedObject from './server/models/SpawnedObject.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/virtualworld';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  // Broadcast to all other clients that a new player joined
  socket.broadcast.emit('playerJoined', socket.id);

  // Send current players to the new player
  const currentPlayers = Object.keys(io.sockets.sockets).filter(id => id !== socket.id);
  currentPlayers.forEach(playerId => {
    socket.emit('playerJoined', playerId);
  });

  // Send all existing spawned objects to the new player
  try {
    const existingObjects = await SpawnedObject.find({});
    existingObjects.forEach(obj => {
      socket.emit('objectSpawned', {
        id: obj.id,
        assetId: obj.assetId,
        position: obj.position,
        playerId: obj.playerId,
      });
    });
  } catch (error) {
    console.error('Error loading existing objects:', error);
  }

  // Handle position updates from clients
  socket.on('updatePosition', (data) => {
    // Broadcast the position update to all other clients
    socket.broadcast.emit('playerUpdate', {
      id: socket.id,
      position: data.position,
      rotation: data.rotation,
    });
  });

  // Voice chat signaling
  socket.on('voice-offer', (data) => {
    socket.to(data.to).emit('voice-offer', { from: socket.id, offer: data.offer });
  });

  socket.on('voice-answer', (data) => {
    socket.to(data.to).emit('voice-answer', { from: socket.id, answer: data.answer });
  });

  socket.on('voice-ice-candidate', (data) => {
    socket.to(data.to).emit('voice-ice-candidate', { from: socket.id, candidate: data.candidate });
  });

  socket.on('voice-speaking', (data) => {
    socket.broadcast.emit('voice-speaking', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Broadcast to all other clients that a player left
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
