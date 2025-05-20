import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse form with uploaded file
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
      filter: (part) => {
        // Filter for allowed file types
        if (part.name === "receipt" && part.mimetype) {
          return (
            part.mimetype.includes("image/jpeg") ||
            part.mimetype.includes("image/png") ||
            part.mimetype.includes("application/pdf")
          );
        }
        return false;
      },
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Handle the file upload
    const [fields, files] = await new Promise<
      [formidable.Fields, formidable.Files]
    >((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.receipt?.[0];
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate unique filename
    const uniqueFilename = `${uuidv4()}-${file.originalFilename}`;
    const newPath = path.join(uploadsDir, uniqueFilename);

    // Move the file from temp location to uploads directory
    await fs.promises.copyFile(file.filepath, newPath);

    // Clean up the temp file
    await fs.promises.unlink(file.filepath);

    // Return the path to the uploaded file
    const publicPath = `/uploads/${uniqueFilename}`;
    return res.status(200).json({
      success: true,
      filePath: publicPath,
      fileName: file.originalFilename,
      fileType: file.mimetype,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ error: "Failed to upload file" });
  }
}
