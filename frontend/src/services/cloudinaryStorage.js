const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'med4u_uploads';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnqn5xuyc';

export const uploadFile = (file, path, progressCallback = null) => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      const folder = path && path.includes('/') ? path.split('/').slice(0, -1).join('/') : 'med4u_connect';
      formData.append('folder', folder);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && progressCallback) {
          const progress = Math.round((event.loaded / event.total) * 100);
          progressCallback(progress);
        }
      });

      xhr.onload = function () {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            path: response.public_id,
            downloadURL: response.secure_url,
            uploadedAt: new Date().toISOString()
          });
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = function () {
        reject(new Error('Upload failed'));
      };

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);
      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
};
