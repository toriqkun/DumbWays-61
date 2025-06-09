const multer = require("multer");
const path = require("path");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]; // Menambahkan .webp juga

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Izinkan file diupload
  } else {
    cb(new Error("Jenis file tidak diizinkan! Hanya .png, .jpg, .jpeg, .webp yang diperbolehkan."), false); // Tolak file
  }
};

// Buat instance Multer upload dengan storage dan fileFilter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Batasi ukuran file hingga 5MB (opsional)
  },
});

module.exports = upload;
