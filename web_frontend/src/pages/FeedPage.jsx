import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import Navbar from '../components/NavBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Styles for the dark gamified theme
const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f0f1a',
    color: '#e0e0e0',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(15, 15, 26, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #00ff88, #7b2ff7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  createButton: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#0f0f1a',
    border: 'none',
    borderRadius: '25px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  feedContainer: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(0, 255, 136, 0.2)',
    borderTop: '3px solid #00ff88',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  navSpacer: {
    height: '70px',
  },
};

const FeedPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef(null);

  // Fetch posts
  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      const response = await axios.get(`${API_URL}/api/feed/posts`, {
        params: { page: pageNum, limit: 20 },
      });

      const newPosts = response.data.posts || [];
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(response.data.pagination?.hasMore || false);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  // Initialize socket and fetch posts
  useEffect(() => {
    // Connect to socket
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    // Listen for real-time updates
    socketRef.current.on('postLiked', (data) => {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.postId === data.postId
            ? { ...post, likes: data.isLiked ? [...post.likes, data.userId] : post.likes.filter(id => id !== data.userId), likesCount: data.likesCount }
            : post
        )
      );
    });

    socketRef.current.on('postCommented', (data) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.postId === data.postId
            ? { ...post, commentsCount: data.commentsCount }
            : post
        )
      );
    });

    // Fetch initial posts
    fetchPosts();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Handle creating a new post
  const handlePostCreated = () => {
    fetchPosts(1, false); // Refresh the feed
    setShowCreateModal(false);
  };

  // Handle like toggle
  const handleLikeToggle = async (postId, isCurrentlyLiked) => {
    if (!user) return;

    try {
      const response = await axios.put(`${API_URL}/api/feed/post/${postId}/like`, {
        userId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || '',
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.postId === postId
            ? { 
                ...post, 
                likes: response.data.isLiked 
                  ? [...post.likes, user.uid] 
                  : post.likes.filter(id => id !== user.uid),
                likesCount: response.data.likesCount 
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle adding a comment
  const handleAddComment = async (postId, text) => {
    if (!user || !text.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/api/feed/post/${postId}/comment`, {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorAvatar: user.photoURL || '',
        text: text.trim(),
      });

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.postId === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        )
      );

      return response.data.comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  };

  // Load more posts
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <Navbar />

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Community Feed</h1>
        <button 
          style={styles.createButton}
          onClick={() => setShowCreateModal(true)}
        >
          + Create Post
        </button>
      </header>

      {/* Feed */}
      <div style={styles.feedContainer}>
        {loading && posts.length === 0 ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📸</div>
            <h2>No posts yet</h2>
            <p>Be the first to share something with the community!</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post.postId}
                post={post}
                currentUser={user}
                onLike={() => handleLikeToggle(post.postId, post.likes?.includes(user?.uid))}
                onComment={handleAddComment}
                imageUrl={`${API_URL}/api/feed/image/${post.imageFilename}`}
              />
            ))}

            {hasMore && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  style={{
                    background: 'transparent',
                    border: '1px solid #00ff88',
                    color: '#00ff88',
                    padding: '10px 30px',
                    borderRadius: '25px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Spacer for bottom navigation */}
      <div style={styles.navSpacer}></div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePostCreated}
          user={user}
        />
      )}
    </div>
  );
};

export default FeedPage;