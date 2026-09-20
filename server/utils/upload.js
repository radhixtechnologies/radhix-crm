const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories based on file type
    let subDir = 'general';
    if (file.fieldname === 'avatar') {
      subDir = 'avatars';
    } else if (file.fieldname === 'document') {
      subDir = 'documents';
    } else if (file.fieldname === 'receipt' || file.fieldname === 'expense-receipt') {
      subDir = 'expenses';
    } else if (file.fieldname === 'import') {
    } else if (file.fieldname === 'import') {
      subDir = 'imports';
    } else if (file.fieldname === 'resume') {
      subDir = 'resumes';
    }

    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Store directory path in req for later use
    req.uploadDir = dir;
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    // Store filename in req for later use
    req.uploadedFilename = filename;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images for avatars
  if (file.fieldname === 'avatar') {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatars!'));
    }
  }
  // Allow documents
  else if (file.fieldname === 'document') {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document type!'));
    }
  }
  // Allow receipts/bills for expenses
  else if (file.fieldname === 'receipt' || file.fieldname === 'expense-receipt') {
    const allowedTypes = /pdf|jpg|jpeg|png|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid receipt type! Only PDF, images, and documents are allowed.'));
    }
  }
  // Allow Excel/CSV for imports
  else if (file.fieldname === 'import') {
    const allowedTypes = /xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid import file type! Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
  // Allow resumes
  else if (file.fieldname === 'resume') {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Invalid resume type! Only PDF, DOC, and DOCX are allowed.'));
    }
  } else {
    cb(null, true);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

// Upload middleware for different file types
exports.uploadAvatar = upload.single('avatar');
exports.uploadDocument = upload.single('document');
exports.uploadReceipt = upload.single('receipt');
exports.uploadImport = upload.single('import');
exports.uploadResume = upload.single('resume');

// Helper to get file URL
exports.getFileUrl = (filename, type = 'general') => {
  if (!filename) return null;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  // If filename already contains path, use it as is
  if (filename.includes('/')) {
    return filename.startsWith('http') ? filename : `${baseUrl}${filename}`;
  }
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Helper to get full file path
exports.getFilePath = (filename, type = 'general') => {
  if (!filename) return null;
  return path.join(uploadsDir, type, filename);
};

// Helper to delete file
exports.deleteFile = (filepath) => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

