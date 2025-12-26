const handleVoiceEvents = (socket) => {
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
};

module.exports = { handleVoiceEvents };