const SpawnedObject = require('../models/SpawnedObject');

const handleObjectEvents = (io, socket) => {
  // Send all existing spawned objects to the new player
  const sendExistingObjects = async () => {
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
  };

  // Call it immediately for new connections
  sendExistingObjects();

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

  // Handle disconnection - remove objects
  socket.on('disconnect', async () => {
    try {
      const deletedCount = await SpawnedObject.deleteMany({ playerId: socket.id });
      console.log(`Removed ${deletedCount.deletedCount} objects for disconnected player ${socket.id}`);
    } catch (err) {
      console.error('Error removing objects on disconnect:', err);
    }
  });
};

module.exports = { handleObjectEvents };