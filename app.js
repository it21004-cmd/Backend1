const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ FIXED: CORS Configuration - Netlify URL add করুন
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://mbstu-research-gate.netlify.app', // ✅ আপনার Netlify URL
    'https://*.netlify.app' // ✅ সব Netlify subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
});

// Global mongoose for routes
global.mongoose = mongoose;

// Routes Loading
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/post'));
app.use('/api/user', require('./routes/user'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notification'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MBSTU Research Gate API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// ✅ FIXED: Preflight requests handle করুন
app.options('*', cors());

// Backend code (Node.js/Express)
app.post('/api/auth/register', async (req, res) => {
  try {
    // User create logic...
    
    // Success response
    res.status(200).json({
      success: true,
      needsVerification: true,  // ✅ এই লাইন গুরুত্বপূর্ণ
      message: "Registration successful! Please verify your email."
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}); 

app.listen(PORT, () => {
  console.log(`🎯 Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});
