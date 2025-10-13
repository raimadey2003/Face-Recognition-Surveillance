import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const PoliceSchema = new mongoose.Schema({
  badgeNumber: { type: String, required: true, unique: true },
  station: { type: String, required: true },
  password: { type: String, required: true }
});

// Hash password before saving
PoliceSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
PoliceSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('Police', PoliceSchema);
