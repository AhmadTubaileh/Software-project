import React, { useState, useRef } from 'react';

function SignUpForm({ onSubmit }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [idCardImage, setIdCardImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = form.su_username.value.trim();
    const email = form.su_email.value.trim();
    const phone = form.su_phone.value.trim();
    const password = form.su_password.value;
    const confirm = form.su_confirm.value;
    
    if (password !== confirm) {
      alert('Passwords do not match!');
      return;
    }
    
    if (password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    if (typeof onSubmit === 'function') {
      onSubmit({ 
        username, 
        email, 
        phone, 
        password,
        card_image: idCardImage 
      });
    }
  }

  const handleImageChange = (file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setIdCardImage(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleImageChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageChange(files[0]);
    }
  };

  const removeImage = () => {
    setIdCardImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Username *</span>
        <input 
          name="su_username" 
          type="text" 
          required 
          placeholder="your username" 
          minLength="3"
        />
      </label>
      
      <label className="form-field">
        <span>Email *</span>
        <input 
          name="su_email" 
          type="email" 
          required 
          placeholder="you@example.com" 
        />
      </label>
      
      <label className="form-field">
        <span>Phone Number *</span>
        <input 
          name="su_phone" 
          type="tel" 
          required 
          placeholder="0597407177" 
          pattern="[0-9]{10,15}"
          title="Please enter a valid phone number (10-15 digits)"
        />
      </label>
      
      <label className="form-field">
        <span>ID Card Photo (Optional)</span>
        <div className="form-image-upload">
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFileInputChange}
            className="hidden" 
            id="idCardUpload"
          />
          
          {!idCardImage ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="mx-auto mb-3 text-gray-400"
              >
                <path 
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none"
                />
                <polyline 
                  points="14,2 14,8 20,8" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none"
                />
                <circle 
                  cx="12" 
                  cy="13" 
                  r="3" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none"
                />
                <path 
                  d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none"
                />
              </svg>
              <div className="text-sm text-gray-400 mb-1">
                {isDragOver ? 'Drop image here' : 'Click to upload or drag and drop'}
              </div>
              <div className="text-xs text-gray-500">
                PNG, JPG, JPEG up to 5MB
              </div>
            </div>
          ) : (
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-500/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-green-500"
                  >
                    <path 
                      d="M20 6L9 17l-5-5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-sm text-green-400 font-medium">Image selected</span>
                </div>
                <button 
                  type="button" 
                  onClick={removeImage}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
              <div className="text-xs text-gray-400 truncate">
                {idCardImage.name} ({(idCardImage.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}
        </div>
      </label>
      
      <label className="form-field">
        <span>Password *</span>
        <div className="form-password">
          <input 
            name="su_password" 
            type={showPw ? 'text' : 'password'} 
            required 
            placeholder="min 8 characters" 
            minLength="8"
          />
          <button 
            type="button" 
            className="pw-toggle" 
            onClick={() => setShowPw(v => !v)} 
            aria-label={showPw ? 'Hide password' : 'Show password'} 
            title={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 12s4-7 11-7c2.2 0 4.1.7 5.6 1.6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M23 12s-4 7-11 7c-2.2 0-4.1-.7-5.6-1.6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
      </label>
      
      <label className="form-field">
        <span>Confirm Password *</span>
        <div className="form-password">
          <input 
            name="su_confirm" 
            type={showConfirm ? 'text' : 'password'} 
            required 
            placeholder="retype password" 
            minLength="8"
          />
          <button 
            type="button" 
            className="pw-toggle" 
            onClick={() => setShowConfirm(v => !v)} 
            aria-label={showConfirm ? 'Hide password' : 'Show password'} 
            title={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1 12s4-7 11-7c2.2 0 4.1.7 5.6 1.6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M23 12s-4 7-11 7c-2.2 0-4.1-.7-5.6-1.6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
      </label>
      
      <button className="btn btn-primary w-full py-3 font-medium" type="submit">
        Create Account
      </button>
    </form>
  );
}

export default SignUpForm;