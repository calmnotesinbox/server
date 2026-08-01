import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env if it exists
if (fs.existsSync('.env')) {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/titiksha_surprise';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(err.message);
  });

// Define Mongoose Schema for Session
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  visitorId: String,
  deviceInfo: {
    browser: String,
    os: String,
    type: { type: String }
  },
  startTime: Date,
  lastActiveTime: Date,
  duration: { type: Number, default: 0 },
  approxLocation: {
    city: String,
    region: String,
    country: String
  },
  clicks: {
    surpriseBtn: { type: Boolean, default: false },
    musicPlayed: { type: Boolean, default: false },
    noClicksCount: { type: Number, default: 0 },
    yesClicksCount: { type: Number, default: 0 },
    letterOpened: { type: Boolean, default: false }
  },
  questions: {
    smileSurprise: String,
    smileToday: String,
    cuteSurprise: String
  },
  timeline: [{
    event: String,
    time: Date
  }],
  feedback: { type: String, default: "" }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

// GET /api/sessions - Used by Admin Dashboard
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/sessions - Upsert a session (Used by frontend tracking)
app.post('/api/sessions', async (req, res) => {
  const data = req.body;
  console.log("Received data from frontend:", data);
  if (!data || !data.sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  try {
    // Upsert: Update if exists, Insert if not
    const result = await Session.findOneAndUpdate(
      { sessionId: data.sessionId },
      { $set: data },
      { new: true, upsert: true }
    );
    console.log("Successfully saved to MongoDB:", result._id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/sessions - Clear all sessions (Used by Admin Dashboard)
app.delete('/api/sessions', async (req, res) => {
  try {
    await Session.deleteMany({});
    res.json({ success: true, message: "All sessions cleared" });
  } catch (error) {
    console.error('Error clearing sessions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
