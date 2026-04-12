import { useRef } from 'react';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import './ImageUploader.css';

export default function ImageUploader({ accept, currentImage, onFileSelect, onClear, id }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (currentImage) {
    return (
      <div className="image-uploader-preview">
        <img src={currentImage} alt="Uploaded" className="image-uploader-img" />
        <div className="image-uploader-overlay">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => inputRef.current?.click()}
            style={{ background: 'rgba(255,255,255,0.9)' }}
          >
            <FiUpload /> Replace
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={onClear}
          >
            <FiX /> Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
          id={id}
        />
      </div>
    );
  }

  return (
    <div
      className="upload-drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      style={{ cursor: 'pointer' }}
    >
      <span className="upload-icon"><FiImage /></span>
      <span className="upload-text">Drag & drop or click to upload</span>
      <span className="upload-hint">JPEG, PNG, WebP — up to 10MB</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        id={id}
      />
    </div>
  );
}
