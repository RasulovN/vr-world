socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Broadcast to all other clients that a player left
    socket.broadcast.emit('playerDisconnected', socket.id);
  }); 
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Broadcast to all other clients that a player left
    socket.broadcast.emit('playerDisconnected', socket.id);
  });

  // Voice chat handlers
  socket.on('voice-offer', (data) => {
    // Forward voice offer to target player
    socket.to(data.to).emit('voice-offer', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('voice-answer', (data) => {
    // Forward voice answer to target player
    socket.to(data.to).emit('voice-answer', {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on('voice-ice-candidate', (data) => {
    // Forward ICE candidate to target player
    socket.to(data.to).emit('voice-ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  socket.on('voice-speaking', (data) => {
    // Broadcast speaking status to all other clients
    socket.broadcast.emit('voice-speaking', {
      playerId: socket.id,
      isSpeaking: data.isSpeaking,
    });
  });
