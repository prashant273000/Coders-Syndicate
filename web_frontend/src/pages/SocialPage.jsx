import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import Navbar from '../components/NavBar';
import { getPosts, createPost, likePost, unlikePost, addComment, getComments, uploadImage, deletePost } from '../services/socialService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocialPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'create', 'online'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    if (user) {
      socket.emit('join', user.uid);
    }

    // Listen for real-time updates
    socket.on('postLiked', (data) => {
      setPosts(prev => prev.map(p => 
        p._id === data.postId 
          ? { ...p, likes: data.isLiked ? [...p.likes, data.userId] : p.likes.filter(id => id !== data.userId), likesCount: data.likesCount }
          : p
      ));
    });

    socket.on('commentAdded', (data) => {
      setPosts(prev => prev.map(p =>
        p._id === data.postId
          ? { ...p, commentsCount: data.commentsCount }
          : p
      ));
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    return () => socket.close();
  }, [user]);

  // Fetch posts
  useEffect(() => {
    const fetchPostsData = async () => {
      try {
        setLoading(true);
        const data = await getPosts(1, 20);
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'feed') {
      fetchPostsData();
    }
  }, [activeTab]);

  // Handle creating a post
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;
    
    setIsPosting(true);
    try {
      let imageUrl = null;
      
      if (newPostImage) {
        const uploadData = await uploadImage(newPostImage);
        imageUrl = uploadData.imageUrl;
      }

      const data = await createPost(
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '',
        newPostContent.trim(),
        imageUrl
      );

      // Emit socket event
      if (socketRef.current) {
        socketRef.current.emit('newPost', data.post);
      }

      // Reset form
      setNewPostContent('');
      setNewPostImage(null);
      setImagePreview(null);
      
      // Refresh posts
      const postsData = await getPosts(1, 20);
      setPosts(postsData.posts || []);
      setActiveTab('feed');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  // Handle like/unlike
  const handleLike = async (postId, isCurrentlyLiked) => {
    try {
      if (isCurrentlyLiked) {
        await unlikePost(postId, user.uid);
      } else {
        await likePost(postId, user.uid);
      }

      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          const newLikes = isCurrentlyLiked 
            ? p.likes.filter(id => id !== user.uid)
            : [...p.likes, user.uid];
          return { ...p, likes: newLikes, likesCount: newLikes.length };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle delete post
  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(postId, user.uid);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Toggle comments section
  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => ({ ...prev, [postId]: false }));
      return;
    }

    try {
      const data = await getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Handle adding a comment
  const handleAddComment = async (postId, content) => {
    if (!content?.trim() || !user) return;

    try {
      const data = await addComment(
        postId,
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || '',
        content.trim()
      );

      if (data.comment) {
        // Update comments list
        setComments(prev => ({
          ...prev,
          [postId]: [...(Array.isArray(prev[postId]) ? prev[postId] : []), data.comment]
        }));
      }

      // Update post comments count
      setPosts(prev => prev.map(p =>
        p._id === postId
          ? { ...p, commentsCount: data.commentsCount ?? (p.commentsCount + 1) }
          : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPostImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Background Orbs */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] bg-pink-600/20 rounded-full filter blur-[100px] animate-pulse" style={{animationDelay:'2s'}}></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] bg-indigo-600/20 rounded-full filter blur-[100px] animate-pulse" style={{animationDelay:'4s'}}></div>
      </div>

      <Navbar />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pt-28 pb-8">
        {/* Tab Navigation */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-1 border border-white/80 inline-flex mb-6 z-10 relative">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-purple-50'
            }`}
          >
            📰 Feed
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-purple-50'
            }`}
          >
            ✏️ Create
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'online'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/60 text-gray-600 hover:bg-purple-50'
            }`}
          >
            👥 Online
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {loading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-48 bg-gray-200 rounded-xl"></div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 p-12 text-center">
                <p className="text-4xl mb-4">📝</p>
                <p className="text-xl font-bold text-gray-900">No posts yet</p>
                <p className="text-gray-500 mt-2">Be the first to share something!</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-500 transition-colors"
                >
                  Create Post
                </button>
              </div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full border-2 border-purple-200"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{post.authorName}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    {post.authorId === user.uid && (
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {/* Image */}
                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt="Post" 
                      className="w-full rounded-2xl object-cover max-h-[400px] mb-4"
                    />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-purple-100">
                    <button
                      onClick={() => handleLike(post._id, post.likes?.includes(user.uid))}
                      className={`flex items-center gap-2 transition-colors ${
                        post.likes?.includes(user.uid) 
                          ? 'text-pink-500 font-bold' 
                          : 'text-gray-600 hover:text-pink-500'
                      }`}
                    >
                      {post.likes?.includes(user.uid) ? '❤️' : '🤍'} 
                      <span>{post.likesCount || 0}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post._id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      💬 <span>{post.commentsCount || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post._id] && (
                    <div className="mt-4 pt-4 border-t border-purple-100">
                      {/* Comment Input */}
                      <div className="flex gap-3 mb-4">
                        <img 
                          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({
                              ...prev,
                              [post._id]: e.target.value
                            }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && commentInputs[post._id]?.trim()) {
                                handleAddComment(post._id, commentInputs[post._id]);
                                setCommentInputs(prev => ({ ...prev, [post._id]: '' }));
                              }
                            }}
                            className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                          <button
                            onClick={() => {
                              if (commentInputs[post._id]?.trim()) {
                                handleAddComment(post._id, commentInputs[post._id]);
                                setCommentInputs(prev => ({ ...prev, [post._id]: '' }));
                              }
                            }}
                            className="text-purple-600 font-bold px-4 py-2 hover:bg-purple-50 rounded-xl transition-colors"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {(comments[post._id] || []).map(comment => (
                          <div key={comment._id} className="flex gap-3">
                            <img 
                              src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
                              alt={comment.authorName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 bg-white/50 rounded-xl p-3">
                              <p className="text-sm font-bold text-purple-600">{comment.authorName}</p>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create a Post</h2>
              
              <div className="flex gap-3 mb-4">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full border-2 border-purple-200"
                />
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's on your mind, coder?"
                    className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 resize-none"
                    rows="4"
                  />
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setNewPostImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors">
                    📷 Add Image
                  </div>
                </label>
                <button
                  onClick={handleCreatePost}
                  disabled={isPosting || (!newPostContent.trim() && !newPostImage)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'online' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Online Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineUsers.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-12">No users online right now</p>
                ) : (
                  onlineUsers.map(u => (
                    <div key={u.uid} className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/80 p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                            alt={u.name}
                            className="w-12 h-12 rounded-full border-2 border-purple-200"
                          />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">Online</p>
                        </div>
                      </div>
                      <button className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-500 transition-colors">
                        Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialPage;