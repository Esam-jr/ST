import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';

// Disable the default body parser as we'll use formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define allowed file types for security
const allowedFileTypes = [
  'application/pdf', // PDF files
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  // Add these MIME types for better compatibility with browser-reported types
  'application/octet-stream', // Generic binary file
  'binary/octet-stream',
];

// File extensions allowed - additional check
const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.doc', '.docx'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  console.log('Upload request received');
  console.log('Headers:', req.headers);

  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory:', uploadDir);
    }

    // Configure formidable to save files to the uploads directory
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      // Allow all file types initially, we'll check later
      filter: part => {
        // Always return true here, we'll validate mime types after parsing
        return true;
      }
    });

    // Parse the form
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Formidable parsing error:', err);
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    // Check if a file was provided
    const file = files.file;
    if (!file) {
      console.error('No file found in the request. Available fields:', Object.keys(files));
      return res.status(400).json({ 
        message: 'No file uploaded', 
        availableFields: Object.keys(files),
        requestHeaders: req.headers['content-type']
      });
    }

    // Access the file information
    const uploadedFile = Array.isArray(file) ? file[0] : file;
    
    // Ensure we have all the necessary file properties
    if (!uploadedFile || !uploadedFile.filepath) {
      console.error('Invalid file object received:', uploadedFile);
      return res.status(400).json({ 
        message: 'Invalid file object received',
        error: 'missing_file_data' 
      });
    }

    console.log('Uploaded file:', {
      name: uploadedFile.originalFilename,
      type: uploadedFile.mimetype,
      size: uploadedFile.size,
      path: uploadedFile.filepath
    });

    // Check file extension
    const originalFilename = uploadedFile.originalFilename || 'unnamed-file';
    const extension = path.extname(originalFilename).toLowerCase();
    
    // More permissive file extension check (case insensitive)
    if (!allowedExtensions.some(ext => extension.toLowerCase() === ext.toLowerCase())) {
      // If file extension is not allowed, delete the file and return an error
      try {
        if (fs.existsSync(uploadedFile.filepath)) {
          fs.unlinkSync(uploadedFile.filepath);
        }
      } catch (unlinkError) {
        console.error('Error deleting invalid file:', unlinkError);
      }
      
      console.error(`File extension not allowed: ${extension}`);
      return res.status(400).json({ 
        message: `File type not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
        error: 'invalid_extension',
        providedExtension: extension
      });
    }

    // Check MIME type (more permissive now)
    if (uploadedFile.mimetype && !allowedFileTypes.includes(uploadedFile.mimetype)) {
      console.warn(`Warning: Unknown MIME type ${uploadedFile.mimetype} for file with extension ${extension}. Proceeding anyway due to valid extension.`);
    }

    // Generate a unique filename to prevent overrides
    const newFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
    
    // Rename the file to its final name
    const newPath = path.join(uploadDir, newFilename);
    fs.renameSync(uploadedFile.filepath, newPath);
    
    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${newFilename}`;
    
    return res.status(200).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: originalFilename,
    });
  } catch (error: any) {
    console.error('Error processing file upload:', error);
    return res.status(500).json({ 
      message: 'Error processing file upload',
      error: error.message || 'Unknown error'
    });
  }
} 