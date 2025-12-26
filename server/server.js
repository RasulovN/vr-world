require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const config = require('./config/index');
const { handlePlayerConnection } = require('./handlers/playerHandler');
const { handleObjectEvents } = require('./handlers/objectHandler');
const { handleVoiceEvents } = require('./handlers/voiceHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Connect to MongoDB
connectDB();

// Socket connection handler
io.on('connection', (socket) => {
  handlePlayerConnection(io, socket);
  handleObjectEvents(io, socket);
  handleVoiceEvents(socket);
});

server.listen(config.port, () => {
  console.log(`Multiplayer server running on port ${config.port} in ${process.env.NODE_ENV} mode`);
});
