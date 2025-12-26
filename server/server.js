const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const SpawnedObject = require('./models/SpawnedObject');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5000", "https://vr-world-bay.vercel.app/"],
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/virtualworld', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

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
    console.log(`Sent ${existingObjects.length} existing objects to new player`);
  } catch (err) {
    console.error('Error loading existing objects:', err);
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

  // Handle object spawning
  socket.on('spawnObject', async (data) => {
    try {
      // Save to database
      const newObject = new SpawnedObject({
        id: data.id,
        assetId: data.assetId,
        position: data.position,
        playerId: socket.id,
      });
      await newObject.save();
      console.log('Object saved to DB:', data.id);

      // Broadcast the spawned object to all other clients
      socket.broadcast.emit('objectSpawned', {
        id: data.id,
        assetId: data.assetId,
        position: data.position,
        playerId: socket.id,
      });
    } catch (err) {
      console.error('Error saving object:', err);
    }
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
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    // Broadcast to all other clients that a player left
    socket.broadcast.emit('playerDisconnected', socket.id);

    // Remove all objects spawned by this player
    try {
      const deletedCount = await SpawnedObject.deleteMany({ playerId: socket.id });
      console.log(`Removed ${deletedCount.deletedCount} objects for disconnected player ${socket.id}`);
    } catch (err) {
      console.error('Error removing objects on disconnect:', err);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
