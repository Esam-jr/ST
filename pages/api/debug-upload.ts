import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import { IncomingMessage } from 'http';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define types for formidable file
interface FormidableFile {
  filepath: string;
  originalFilename?: string;
  size: number;
  mimetype?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Debug upload API called');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory:', uploadDir);
    }

    // Simple file writing test
    const testFilePath = path.join(uploadDir, 'test-write.txt');
    try {
      fs.writeFileSync(testFilePath, 'Test write: ' + new Date().toString());
      console.log('Write test successful');
    } catch (writeErr) {
      console.error('Write test failed:', writeErr);
    }

    // Log request body type
    const contentType = req.headers['content-type'] || 'none';
    console.log('Content-Type:', contentType);

    // Configure formidable
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // 20MB
      multiples: false,
    });

    // Parse the form
    const parseForm = async (req: IncomingMessage): Promise<{ fields: formidable.Fields, files: formidable.Files }> => {
      return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error('Formidable parse error:', err);
            reject(err);
            return;
          }
          resolve({ fields, files });
        });
      });
    };

    try {
      console.log('Starting to parse form data...');
      const { fields, files } = await parseForm(req);
      console.log('Form data parsed successfully');
      console.log('Fields:', fields);

      // Log files with type safety
      console.log('Files received:', Object.keys(files));
      
      // Check if a file was provided
      const file = files.file as FormidableFile | FormidableFile[] | undefined;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded', receivedData: { fields } });
      }

      // Access the file information
      const uploadedFile = Array.isArray(file) ? file[0] : file;
      
      console.log('Uploaded file details:', {
        name: uploadedFile.originalFilename,
        size: uploadedFile.size,
        type: uploadedFile.mimetype
      });
      
      // Generate a unique filename
      const originalFilename = uploadedFile.originalFilename || 'unnamed-file';
      const extension = path.extname(originalFilename);
      const newFilename = `debug-${Date.now()}-${Math.random().toString(36).substring(2, 15)}${extension}`;
      
      // Rename the file
      const newPath = path.join(uploadDir, newFilename);
      fs.renameSync(uploadedFile.filepath, newPath);
      
      // Return success
      const fileUrl = `/uploads/${newFilename}`;
      return res.status(200).json({
        message: 'File uploaded successfully to debug endpoint',
        url: fileUrl,
        filename: originalFilename,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype
      });
    } catch (parseError) {
      console.error('Error parsing form:', parseError);
      return res.status(500).json({ 
        message: 'Error parsing form data', 
        error: parseError instanceof Error ? parseError.message : String(parseError) 
      });
    }
  } catch (error) {
    console.error('Error in debug-upload handler:', error);
    return res.status(500).json({ 
      message: 'Server error during file upload',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 