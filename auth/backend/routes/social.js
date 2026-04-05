const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social-posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /social/post - Create a new post
router.post('/post', async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, content, imageUrl } = req.body;

    if (!authorId || !authorName) {
      return res.status(400).json({ error: 'Author ID and name are required' });
    }

    const post = new Post({
      authorId,
      authorName,
      authorAvatar: authorAvatar || '',
      content: content || '',
      imageUrl: imageUrl || '',
      imageFilename: '',
      likes: [],
      commentsCount: 0,
    });

    await post.save();

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        _id: post._id,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        content: post.content,
        imageUrl: post.imageUrl,
        likes: post.likes,
        likesCount: post.likes.length,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// GET /social/posts - Get all posts with pagination
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments();

    res.json({
      posts: posts.map(post => ({
        _id: post._id,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        content: post.content,
        imageUrl: post.imageUrl,
        likes: post.likes,
        likesCount: post.likes.length,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
      })),
      total,
      page,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts', posts: [] });
  }
});

// POST /social/posts/:postId/like - Like a post
router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    let isLiked;

    if (likeIndex === -1) {
      post.likes.push(userId);
      isLiked = true;
    } else {
      post.likes.splice(likeIndex, 1);
      isLiked = false;
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post liked' : 'Post unliked',
      likes: post.likes,
      likesCount: post.likes.length,
      isLiked,
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('postLiked', {
        postId: post._id,
        userId,
        isLiked,
        likesCount: post.likes.length,
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /social/posts/:postId/unlike - Unlike a post (alias to like route)
router.post('/posts/:postId/unlike', async (req, res) => {
  // Reuse the like logic - it toggles
  req.method = 'POST';
  return router.handle('/posts/:postId/like')(req, res);
});

// DELETE /social/posts/:postId - Delete a post
router.delete('/posts/:postId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete comments
    await Comment.deleteMany({ postId });

    // Delete post
    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Post deleted successfully', success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /social/posts/:postId/comment - Add a comment
router.post('/posts/:postId/comment', async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, content } = req.body;
    const { postId } = req.params;

    if (!authorId || !authorName || !content) {
      return res.status(400).json({ error: 'Author ID, name, and content are required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = new Comment({
      postId,
      authorId,
      authorName,
      authorAvatar: authorAvatar || '',
      content: content.trim(),
    });

    await comment.save();

    // Update post comments count
    post.commentsCount = await Comment.countDocuments({ postId });
    await post.save();

    res.status(201).json({
      message: 'Comment added',
      comment: {
        _id: comment._id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        content: comment.content,
        createdAt: comment.createdAt,
      },
      commentsCount: post.commentsCount,
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('commentAdded', {
        postId: post._id,
        commentsCount: post.commentsCount,
      });
    }
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /social/posts/:postId/comments - Get all comments for a post
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      comments: comments.map(comment => ({
        _id: comment._id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        content: comment.content,
        createdAt: comment.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments', comments: [] });
  }
});

// POST /social/upload - Upload image to Cloudinary
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    res.json({
      imageUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;