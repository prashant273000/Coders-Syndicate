const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// GridFS storage configuration
let storage;
let upload;

// Initialize GridFS storage (will be set up when MongoDB connects)
const initializeGridFS = (conn) => {
  storage = new GridFsStorage({
    db: conn,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          return reject(new Error('Only image files are allowed'));
        }
        
        // Generate unique filename
        const ext = file.mimetype.split('/')[1];
        const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
        
        resolve({
          filename,
          bucketName: 'photos', // GridFS bucket name
          metadata: {
            contentType: file.mimetype,
            uploadedBy: req.body.authorId || 'anonymous',
          },
        });
      });
    },
  });

  upload = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
};

// POST /feed/upload - Upload image to GridFS
router.post('/upload', (req, res) => {
  if (!upload) {
    return res.status(500).json({ error: 'GridFS not initialized' });
  }

  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    res.json({
      filename: req.file.filename,
      contentType: req.file.contentType || req.file.mimetype,
    });
  });
});

// POST /feed/post - Create a new post
router.post('/post', async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, caption, imageFilename, imageContentType } = req.body;

    if (!authorId || !imageFilename) {
      return res.status(400).json({ error: 'Author ID and image filename are required' });
    }

    const post = new Post({
      authorId,
      authorName: authorName || 'Anonymous',
      authorAvatar: authorAvatar || '',
      caption: caption || '',
      imageFilename,
      imageContentType: imageContentType || 'image/jpeg',
    });

    await post.save();

    res.status(201).json({
      message: 'Post created successfully',
      post: {
        postId: post._id,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        caption: post.caption,
        imageFilename: post.imageFilename,
        likes: post.likes,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// GET /feed/image/:filename - Stream image from GridFS
router.get('/image/:filename', async (req, res) => {
  try {
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'photos',
    });

    const filename = req.params.filename;
    
    // Find the file
    const files = await bucket.find({ filename }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const file = files[0];
    
    // Set content type
    const contentType = file.metadata?.contentType || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file
    const downloadStream = bucket.openDownloadStream(file._id);
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download image' });
      }
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

// GET /feed/posts - Get all posts (paginated)
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments();

    res.json({
      posts: posts.map(post => ({
        postId: post._id,
        authorId: post.authorId,
        authorName: post.authorName,
        authorAvatar: post.authorAvatar,
        caption: post.caption,
        imageFilename: post.imageFilename,
        likes: post.likes,
        likesCount: post.likes.length,
        commentsCount: post.commentsCount,
        createdAt: post.createdAt,
        isLiked: false, // Will be updated by frontend based on current user
      })),
      pagination: {
        currentPage: page,
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// PUT /feed/post/:id/like - Toggle like on a post
router.put('/post/:id/like', async (req, res) => {
  try {
    const { userId, authorName, authorAvatar } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    let isLiked;

    if (likeIndex === -1) {
      // Add like
      post.likes.push(userId);
      isLiked = true;
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
      isLiked = false;
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post liked' : 'Post unliked',
      isLiked,
      likesCount: post.likes.length,
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('postLiked', {
        postId: post._id,
        userId,
        authorName,
        authorAvatar,
        isLiked,
        likesCount: post.likes.length,
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /feed/post/:id/comment - Add a comment to a post
router.post('/post/:id/comment', async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, text } = req.body;

    if (!authorId || !text) {
      return res.status(400).json({ error: 'Author ID and comment text are required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = new Comment({
      postId: req.params.id,
      authorId,
      authorName: authorName || 'Anonymous',
      authorAvatar: authorAvatar || '',
      text: text.trim(),
    });

    await comment.save();

    // Update post comments count
    post.commentsCount = await Comment.countDocuments({ postId: req.params.id });
    await post.save();

    res.status(201).json({
      message: 'Comment added',
      comment: {
        commentId: comment._id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        text: comment.text,
        createdAt: comment.createdAt,
      },
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('postCommented', {
        postId: post._id,
        comment: {
          commentId: comment._id,
          authorId: comment.authorId,
          authorName: comment.authorName,
          authorAvatar: comment.authorAvatar,
          text: comment.text,
          createdAt: comment.createdAt,
        },
        commentsCount: post.commentsCount,
      });
    }
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /feed/post/:id/comments - Get all comments for a post
router.get('/post/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    res.json({
      comments: comments.map(comment => ({
        commentId: comment._id,
        postId: comment.postId,
        authorId: comment.authorId,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        text: comment.text,
        createdAt: comment.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// DELETE /feed/post/:id - Delete a post (optional)
router.delete('/post/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete comments
    await Comment.deleteMany({ postId: req.params.id });

    // Delete post
    await Post.findByIdAndDelete(req.params.id);

    // Delete image from GridFS
    const conn = mongoose.connection;
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'photos',
    });

    const files = await bucket.find({ filename: post.imageFilename }).toArray();
    if (files.length > 0) {
      await bucket.delete(files[0]._id);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = { feedRoutes: router, initializeGridFS };