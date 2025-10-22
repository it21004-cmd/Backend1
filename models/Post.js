const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  image: {
    type: String, // Image URL store korbe
    default: null
  },
  file: {
    name: String,
    url: String
  },
  postType: {
    type: String,
    enum: ['text', 'image', 'file'],
    required: true
  },
  
  // ✅ NEW: Like সিস্টেম
  likes: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // ✅ NEW: Comment সিস্টেম
  comments: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    text: String,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // ✅ NEW: Share সিস্টেম (ঐচ্ছিক)
  shares: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);