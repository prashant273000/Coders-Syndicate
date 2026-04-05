import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create a new post
export const createPost = async (authorId, authorName, authorAvatar, content, imageUrl = null) => {
  try {
    const response = await axios.post(`${API_URL}/api/social/post`, {
      authorId,
      authorName,
      authorAvatar,
      content,
      imageUrl,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Get all posts with pagination
export const getPosts = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/api/social/posts`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], pagination: { total: 0, page, hasMore: false } };
  }
};

// Like a post
export const likePost = async (postId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/api/social/posts/${postId}/like`, {
      userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

// Unlike a post
export const unlikePost = async (postId, userId) => {
  try {
    const response = await axios.post(`${API_URL}/api/social/posts/${postId}/like`, {
      userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId, userId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/social/posts/${postId}`, {
      data: { userId },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Add a comment to a post
export const addComment = async (postId, authorId, authorName, authorAvatar, content) => {
  try {
    const response = await axios.post(`${API_URL}/api/social/posts/${postId}/comment`, {
      authorId,
      authorName,
      authorAvatar,
      content,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get comments for a post
export const getComments = async (postId) => {
  try {
    const response = await axios.get(`${API_URL}/api/social/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { comments: [] };
  }
};

// Upload an image
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(`${API_URL}/api/social/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};