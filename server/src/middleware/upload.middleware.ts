import fs from "fs";
import path from "path";
import multer from "multer";

const receiptUploadDir = path.join(process.cwd(), "uploads", "receipts");

if (!fs.existsSync(receiptUploadDir)) {
  fs.mkdirSync(receiptUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, receiptUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP, or PDF receipt files are allowed"));
  }

  cb(null, true);
};

export const receiptUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});