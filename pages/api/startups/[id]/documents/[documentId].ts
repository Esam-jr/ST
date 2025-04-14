import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../../lib/prisma';
import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { id, documentId } = req.query;
  const startupId = Array.isArray(id) ? id[0] : id;
  const docId = Array.isArray(documentId) ? documentId[0] : documentId;
  
  if (!startupId || !docId) {
    return res.status(400).json({ message: 'Startup ID and Document ID are required' });
  }
  
  try {
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    
    // Check if document exists and belongs to the startup
    const document = await prisma.document.findFirst({
      where: { 
        id: docId,
        startupId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // GET /api/startups/[id]/documents/[documentId] - Get a specific document
    if (req.method === 'GET') {
      return res.status(200).json(document);
    }
    
    // DELETE /api/startups/[id]/documents/[documentId] - Delete a document
    if (req.method === 'DELETE') {
      // Check if user has permission to delete documents
      const isFounder = startup.founderId === session.user.id;
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      const isAdmin = user?.role === 'ADMIN';
      const isUploader = document.uploadedById === session.user.id;
      
      if (!isFounder && !isAdmin && !isUploader) {
        return res.status(403).json({ message: 'Only the founder, admin, or document uploader can delete documents' });
      }
      
      // Delete the file from the filesystem
      try {
        const filePath = path.join(process.cwd(), 'public', document.url);
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Continue even if file deletion fails (file might not exist)
      }
      
      // Delete the document record from the database
      await prisma.document.delete({
        where: { id: docId },
      });
      
      return res.status(200).json({ message: 'Document deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`Error handling document ${req.method} request:`, error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
}
