import { useState, useEffect } from 'react';

const styles = {
  card: {
    background: '#1a1a2e',
    borderRadius: '16px',
    marginBottom: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 255, 136, 0.1)',
    transition: 'border-color 0.3s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #00ff88',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#e0e0e0',
    margin: 0,
  },
  timestamp: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    maxHeight: '500px',
    objectFit: 'cover',
    display: 'block',
  },
  imageLoading: {
    width: '100%',
    maxHeight: '500px',
    background: 'linear-gradient(90deg, #1a1a2e 25%, #2a2a3e 50%, #1a1a2e 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  caption: {
    padding: '16px',
    fontSize: '14px',
    color: '#e0e0e0',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    gap: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  likeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  likeButtonActive: {
    color: '#ff4757',
  },
  likeCount: {
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  commentsSection: {
    padding: '0 16px 16px',
  },
  viewComments: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '4px 0',
  },
  commentInput: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  commentInputField: {
    flex: 1,
    background: '#0f0f1a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '8px 16px',
    color: '#e0e0e0',
    fontSize: '13px',
    outline: 'none',
  },
  commentSubmit: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#0f0f1a',
    border: 'none',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  commentList: {
    marginTop: '12px',
  },
  comment: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  commentAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    flexShrink: 0,
  },
  commentContent: {
    flex: 1,
    background: '#0f0f1a',
    borderRadius: '12px',
    padding: '8px 12px',
  },
  commentAuthor: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00ff88',
  },
  commentText: {
    fontSize: '13px',
    color: '#e0e0e0',
    marginTop: '2px',
  },
};

const PostCard = ({ post, currentUser, onLike, onComment, imageUrl }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount || 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setLiked(post.likes?.includes(currentUser?.uid));
    setLikeCount(post.likesCount || post.likes?.length || 0);
  }, [post.likes, post.likesCount, currentUser?.uid]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike();
  };

  const handleToggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feed/post/${post.postId}/comments`);
        const data = await response.json();
        setComments(data.comments || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = await onComment(post.postId, newComment);
    if (comment) {
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

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

  return (
    <div style={styles.card}>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>

      {/* Header */}
      <div style={styles.header}>
        <img 
          src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorId}`} 
          alt={post.authorName}
          style={styles.avatar}
        />
        <div style={styles.authorInfo}>
          <p style={styles.authorName}>{post.authorName}</p>
          <p style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Image */}
      <div style={styles.imageContainer}>
        {imageUrl && (
          <>
            {!imageLoaded && <div style={styles.imageLoading} />}
            <img 
              src={imageUrl} 
              alt="Post"
              style={{
                ...styles.image,
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div style={styles.caption}>
          <strong>{post.authorName}</strong> {post.caption}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button 
          style={{
            ...styles.likeButton,
            ...(liked ? styles.likeButtonActive : {}),
          }}
          onClick={handleLike}
        >
          <span style={{ 
            fontSize: '18px',
            animation: liked ? 'pulse 0.3s ease' : 'none',
          }}>
            {liked ? '❤️' : '🤍'}
          </span>
        </button>
        
        <button 
          style={styles.actionButton}
          onClick={handleToggleComments}
        >
          <span style={{ fontSize: '18px' }}>💬</span>
        </button>

        <span style={styles.likeCount}>{likeCount} likes</span>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={styles.commentsSection}>
          {loadingComments ? (
            <p style={{ color: '#666', fontSize: '13px' }}>Loading comments...</p>
          ) : (
            <>
              {comments.length > 0 && (
                <div style={styles.commentList}>
                  {comments.slice(-3).map(comment => (
                    <div key={comment.commentId} style={styles.comment}>
                      <img 
                        src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorId}`}
                        alt={comment.authorName}
                        style={styles.commentAvatar}
                      />
                      <div style={styles.commentContent}>
                        <p style={styles.commentAuthor}>{comment.authorName}</p>
                        <p style={styles.commentText}>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={styles.commentInput}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  style={styles.commentInputField}
                />
                <button 
                  onClick={handleAddComment}
                  style={styles.commentSubmit}
                >
                  Post
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;