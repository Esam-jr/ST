import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

// Disable the default body parser to support file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { id } = req.query;
  const startupId = Array.isArray(id) ? id[0] : id;
  
  if (!startupId) {
    return res.status(400).json({ message: 'Startup ID is required' });
  }
  
  // GET /api/startups/[id]/documents - Fetch documents for a startup
  if (req.method === 'GET') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Fetch documents with uploader information
      const documents = await prisma.document.findMany({
        where: { startupId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return res.status(200).json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ message: 'Failed to fetch documents' });
    }
  }
  
  // POST /api/startups/[id]/documents - Upload a new document
  if (req.method === 'POST') {
    try {
      // Check if startup exists
      const startup = await prisma.startup.findUnique({
        where: { id: startupId },
      });
      
      if (!startup) {
        return res.status(404).json({ message: 'Startup not found' });
      }
      
      // Check if user has permission to upload documents
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      
      // Check if user is a team member
      const isTeamMember = await prisma.teamMember.findFirst({
        where: {
          startupId,
          userId: session.user.id
        }
      });
      
      if (!isFounder && !isAdmin && !isTeamMember) {
        return res.status(403).json({ message: 'Only the founder, admin, or team members can upload documents' });
      }
      
      // Parse form data (file upload)
      const form = new IncomingForm({
        uploadDir: path.join(process.cwd(), 'public', 'uploads'),
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
      });
      
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          return res.status(500).json({ message: 'Error processing file upload' });
        }
        
        // Check if file was provided
        const file = files.file?.[0];
        if (!file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Get form fields
        const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
        
        if (!name) {
          return res.status(400).json({ message: 'Document name is required' });
        }
        
        // Generate a unique filename
        const fileName = `${Date.now()}-${file.originalFilename}`;
        const uploadPath = path.join('uploads', fileName);
        
        // Move the file to the permanent location
        try {
          await fs.rename(file.filepath, path.join(process.cwd(), 'public', uploadPath));
        } catch (error) {
          console.error('Error moving file:', error);
          return res.status(500).json({ message: 'Error saving file' });
        }
        
        // Determine file type
        const fileType = file.mimetype || 'application/octet-stream';
        
        // Create the document record in the database
        const document = await prisma.document.create({
          data: {
            name,
            description: description || null,
            type: fileType,
            size: file.size,
            url: `/uploads/${fileName}`,
            startup: { connect: { id: startupId } },
            uploadedBy: { connect: { id: session.user.id } },
          },
        });
        
        return res.status(201).json(document);
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({ message: 'Failed to upload document' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
