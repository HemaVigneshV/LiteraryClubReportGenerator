import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, '..', 'templates');

// List all available header images
export function listHeaders(req, res) {
  try {
    const files = fs.readdirSync(templatesDir).filter(f =>
      /\.(png|jpe?g|webp|gif)$/i.test(f)
    );

    const headers = files.map(filename => ({
      filename,
      url: `/templates/${filename}`,
      label: filename
        .replace(/\.[^.]+$/, '')          // remove extension
        .replace(/[-_]/g, ' ')            // replace dashes/underscores
        .replace(/\b\w/g, c => c.toUpperCase()) // title-case
    }));

    res.json({ headers });
  } catch (err) {
    console.error('ListHeaders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Upload a new header image (persists globally)
export function uploadHeader(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No header image uploaded' });
    }

    // Move file from uploads/ to templates/
    const srcPath = req.file.path;
    const destFilename = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destPath = path.join(templatesDir, destFilename);

    // If file already exists, add a suffix
    let finalFilename = destFilename;
    if (fs.existsSync(destPath)) {
      const ext = path.extname(destFilename);
      const name = path.basename(destFilename, ext);
      finalFilename = `${name}_${Date.now()}${ext}`;
    }

    const finalPath = path.join(templatesDir, finalFilename);
    fs.copyFileSync(srcPath, finalPath);
    fs.unlinkSync(srcPath); // Remove from uploads

    res.status(201).json({
      message: 'Header uploaded successfully',
      header: {
        filename: finalFilename,
        url: `/templates/${finalFilename}`,
        label: finalFilename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }
    });
  } catch (err) {
    console.error('UploadHeader error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
