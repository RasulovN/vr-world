const players = new Map();

const handlePlayerConnection = (io, socket) => {
  console.log('A user connected:', socket.id);

  // Broadcast to all other clients that a new player joined
  socket.broadcast.emit('playerJoined', socket.id);

  // Send current players' positions to the new player
  players.forEach((data, playerId) => {
    socket.emit('playerUpdate', {
      id: playerId,
      position: data.position,
      rotation: data.rotation,
    });
  });

  // Handle position updates from clients
  socket.on('updatePosition', (data) => {
    // Update stored position
    players.set(socket.id, { position: data.position, rotation: data.rotation });
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
    players.delete(socket.id);
    // Broadcast to all other clients that a player left
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
};

module.exports = { handlePlayerConnection };