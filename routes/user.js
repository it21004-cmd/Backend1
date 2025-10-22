const multer = require('multer');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.post('/upload', upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), async (req, res) => {
  res.status(200).json({ files: req.files });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, dob, gender, bio } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, dob, gender, bio },
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
