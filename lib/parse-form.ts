import { NextApiRequest } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface ParsedForm {
  fields: formidable.Fields;
  files: formidable.Files;
}

export const parseForm = (req: NextApiRequest): Promise<ParsedForm> => {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(process.cwd(), "public/uploads/receipts");
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      multiples: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      uploadDir,
      keepExtensions: true,
      filename: (_name, _ext, part) => {
        const uniqueFilename = `${uuidv4()}${path.extname(
          part.originalFilename || ""
        )}`;
        return uniqueFilename;
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}; 