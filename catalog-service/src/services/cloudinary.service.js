const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const subirImagenACloudinary = (file, carpeta = process.env.CLOUDINARY_FOLDER) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: carpeta || 'sigairbnb/inmuebles',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

const eliminarImagenCloudinary = async (publicId) => {
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'image'
  });
};

module.exports = {
  subirImagenACloudinary,
  eliminarImagenCloudinary
};