import { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#1a1a2e',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '500px',
    border: '1px solid rgba(0, 255, 136, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 255, 136, 0.2)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
  },
  body: {
    padding: '20px',
  },
  dropZone: {
    border: '2px dashed rgba(0, 255, 136, 0.3)',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
  },
  dropZoneActive: {
    borderColor: '#00ff88',
    background: 'rgba(0, 255, 136, 0.05)',
  },
  dropZoneIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  dropZoneText: {
    color: '#888',
    fontSize: '14px',
  },
  dropZoneHighlight: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: '20px',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  removeImageButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionInput: {
    width: '100%',
    background: '#0f0f1a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '16px',
    color: '#e0e0e0',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitButton: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#0f0f1a',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(15, 15, 26, 0.3)',
    borderTop: '2px solid #0f0f1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
    marginRight: '8px',
    verticalAlign: 'middle',
  },
  error: {
    background: 'rgba(255, 71, 87, 0.1)',
    border: '1px solid rgba(255, 71, 87, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#ff4757',
    fontSize: '13px',
    marginBottom: '16px',
  },
};

const CreatePostModal = ({ onClose, onSuccess, user }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setError('');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      setError('Please select an image');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Step 1: Upload image to GridFS
      const formData = new FormData();
      formData.append('image', image);

      const uploadResponse = await fetch(`${API_URL}/api/feed/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const { filename, contentType } = uploadData;

      // Step 2: Create post
      const postResponse = await fetch(`${API_URL}/api/feed/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorAvatar: user.photoURL || '',
          caption: caption.trim(),
          imageFilename: filename,
          imageContentType: contentType,
        }),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      // Success!
      onSuccess();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create Post</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.body}>
          {error && <div style={styles.error}>{error}</div>}

          {imagePreview ? (
            <div style={styles.previewContainer}>
              <img src={imagePreview} alt="Preview" style={styles.previewImage} />
              <button style={styles.removeImageButton} onClick={handleRemoveImage}>
                ✕
              </button>
            </div>
          ) : (
            <div
              style={{
                ...styles.dropZone,
                ...(isDragging ? styles.dropZoneActive : {}),
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={styles.dropZoneIcon}>📸</div>
              <div style={styles.dropZoneText}>
                Drag & drop an image here or <span style={styles.dropZoneHighlight}>browse</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          )}

          <textarea
            style={styles.captionInput}
            placeholder="Write a caption... (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
          />
        </div>

        <div style={styles.footer}>
          <button
            style={{
              ...styles.submitButton,
              ...(!image || isUploading ? styles.submitButtonDisabled : {}),
            }}
            onClick={handleSubmit}
            disabled={!image || isUploading}
          >
            {isUploading ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Uploading...
              </>
            ) : (
              'Share Post'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;