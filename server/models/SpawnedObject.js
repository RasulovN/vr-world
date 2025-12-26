import mongoose from 'mongoose';

const spawnedObjectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  assetId: {
    type: String,
    required: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
  },
  playerId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SpawnedObject', spawnedObjectSchema);