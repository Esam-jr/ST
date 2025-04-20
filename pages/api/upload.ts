import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import { Fields, Files, File } from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Disabling built-in bodyParser to use formidable
  },
};

const allowedFileTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ensure user is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Parse the form data
  const form = new IncomingForm({
    uploadDir: path.join(process.cwd(), 'public/uploads'),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });

    const file = files.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // In case of multiple files, handle the first one
    const uploadedFile = Array.isArray(file) ? file[0] : file;
    
    // Validate file type
    if (!allowedFileTypes.includes(uploadedFile.mimetype || '')) {
      // Remove the invalid file
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ message: 'Invalid file type. Only PDF and Excel files are allowed.' });
    }

    // Create a unique filename with user ID to avoid collisions
    const originalFilename = uploadedFile.originalFilename || 'unnamed-file';
    const fileExtension = path.extname(originalFilename);
    const timestamp = Date.now();
    const newFilename = `${session.user.id}_${timestamp}${fileExtension}`;
    const newPath = path.join(process.cwd(), 'public/uploads', newFilename);

    // Rename the file (move to final location with proper name)
    fs.renameSync(uploadedFile.filepath, newPath);

    // Generate the URL for the file
    const fileUrl = `/uploads/${newFilename}`;

    return res.status(200).json({
      url: fileUrl,
      filename: originalFilename,
    });
    
  } catch (error) {
    console.error('Error processing file upload:', error);
    return res.status(500).json({ message: 'Error processing file upload' });
  }
} 