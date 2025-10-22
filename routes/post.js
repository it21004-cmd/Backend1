const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { text, postType, image, file } = req.body;

    const newPost = await Post.create({
      user: req.user.id,
      text: text || '',
      postType: postType || 'text',
      image: image || null,
      file: file || null,
      createdAt: new Date()
    });

    await newPost.populate('user', 'name email');

    res.status(201).json({
      success: true, // ✅ Added success property
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      success: false, // ✅ Added success property
      message: 'Post creation failed', 
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email')
      .populate('likes.user', 'name')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      success: false, // ✅ Added success property
      message: 'Failed to fetch posts', 
      error: error.message 
    });
  }
});

router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ 
        success: false, // ✅ Added success property
        message: 'Post not found' 
      });
    }

    const alreadyLiked = post.likes.some(like => like.user.toString() === userId);
    
    if (alreadyLiked) {
      post.likes = post.likes.filter(like => like.user.toString() !== userId);
    } else {
      post.likes.push({ user: userId });
    }
    
    await post.save();
    
    await post.populate('likes.user', 'name');
    
    res.json({ 
      success: true, 
      likes: post.likes,
      message: alreadyLiked ? 'Post unliked' : 'Post liked'
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ 
      success: false, // ✅ Added success property
      message: 'Failed to like post', 
      error: error.message 
    });
  }
});

router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ 
        success: false, // ✅ Added success property
        message: 'Comment text is required' 
      });
    }

    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, // ✅ Added success property
        message: 'Post not found' 
      });
    }
    
    post.comments.push({
      user: req.user.id,
      text: text.trim()
    });
    
    await post.save();
    
    await post.populate('comments.user', 'name');
    
    res.json({ 
      success: true, 
      comments: post.comments,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ 
      success: false, // ✅ Added success property
      message: 'Failed to add comment', 
      error: error.message 
    });
  }
});

router.get('/my-posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ 
      success: false, // ✅ Added success property
      message: 'Failed to fetch user posts' 
    });
  }
});

// ✅ FIXED: Delete route with proper response format
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false, // ✅ Added success property
        message: 'Post not found' 
      });
    }
    
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, // ✅ Added success property
        message: 'Not authorized to delete this post' 
      });
    }
    
    await Post.findByIdAndDelete(req.params.postId);
    
    res.json({ 
      success: true, // ✅ Added success property
      message: 'Post deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false, // ✅ Added success property
      message: 'Failed to delete post',
      error: error.message 
    });
  }
});

module.exports = router;
