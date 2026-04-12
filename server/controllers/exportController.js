import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle } from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
const templatesDir = path.join(__dirname, '..', 'templates');

function getImageBuffer(filename, dir = uploadsDir) {
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  return null;
}

function imageToBase64(filename, dir = uploadsDir) {
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filename).slice(1).replace('jpg', 'jpeg');
    return `data:image/${ext};base64,${fs.readFileSync(filePath).toString('base64')}`;
  }
  return '';
}

function makeSectionTitle(text) {
  return new Paragraph({
    spacing: { before: 300, after: 100 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Times New Roman', color: '1B3A5C' })]
  });
}

function makeWinnersDocxTable(entries) {
  const headerRow = new TableRow({
    children: ['Place', 'Name', 'Roll Number', 'Class/Sec', 'Phone'].map(h =>
      new TableCell({
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 20, font: 'Times New Roman', color: 'FFFFFF' })] })],
        shading: { fill: '1B3A5C' },
        width: { size: 20, type: WidthType.PERCENTAGE }
      })
    )
  });
  const dataRows = (entries || []).map(w =>
    new TableRow({
      children: [w.place, w.name, w.rollNumber, w.classSec, w.phone].map(val =>
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: val || '', size: 20, font: 'Times New Roman' })] })],
          width: { size: 20, type: WidthType.PERCENTAGE }
        })
      )
    })
  );
  return new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}

export async function exportDocx(req, res) {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const winnerGroups = JSON.parse(report.winnerGroups || '[]');
    const eventImages = JSON.parse(report.eventImages || '[]');
    const registrationImages = JSON.parse(report.registrationImages || '[]');
    const customSections = JSON.parse(report.customSections || '[]');

    const children = [];

    // Header image
    const headerBuffer = getImageBuffer(report.headerImage || 'header-1.png', templatesDir);
    if (headerBuffer) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: headerBuffer, transformation: { width: 650, height: 100 }, type: 'png' })]
      }));
      children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: '1B3A5C' } }, spacing: { after: 200 } }));
    }

    // Title
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: report.title, bold: true, size: 36, font: 'Times New Roman', color: '1B3A5C' })]
    }));

    const sectionOrder = JSON.parse(report.sectionOrder || '["description", "poster", "registration", "winnerGroups", "customSections", "eventImages"]');

    // Title and Date are always at top
    // Date
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 300 },
      children: [new TextRun({ text: `Date: ${new Date(report.eventDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 24, font: 'Times New Roman', color: '555555' })]
    }));

    for (const key of sectionOrder) {
      if (key === 'description') {
        if (report.description) {
          children.push(makeSectionTitle('Circular / Description'));
          children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: report.description, size: 22, font: 'Times New Roman' })] }));
        }
        if (report.circularImage) {
          const buf = getImageBuffer(report.circularImage);
          if (buf) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [new ImageRun({ data: buf, transformation: { width: 500, height: 350 } })] }));
        }
      } else if (key === 'poster') {
        if (report.posterImage) {
          children.push(makeSectionTitle('Event Poster'));
          const buf = getImageBuffer(report.posterImage);
          if (buf) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new ImageRun({ data: buf, transformation: { width: 450, height: 600 } })] }));
        }
      } else if (key === 'registration') {
        if (registrationImages.length > 0) {
          children.push(makeSectionTitle('Registration Sheets'));
          for (const img of registrationImages) {
            const buf = getImageBuffer(img);
            if (buf) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new ImageRun({ data: buf, transformation: { width: 550, height: 400 } })] }));
          }
        }
      } else if (key === 'winnerGroups') {
        for (const group of winnerGroups) {
          children.push(makeSectionTitle(group.title || 'Winners'));
          if (group.description) {
            children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: group.description, size: 22, font: 'Times New Roman', italics: true })] }));
          }
          if (group.entries && group.entries.length > 0) {
            children.push(makeWinnersDocxTable(group.entries));
          }
        }
      } else if (key === 'customSections') {
        for (const section of customSections) {
          children.push(makeSectionTitle(section.title || 'Additional Section'));
          if (section.content) {
            children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: section.content, size: 22, font: 'Times New Roman' })] }));
          }
          if (section.images && section.images.length > 0) {
            for (const img of section.images) {
              const buf = getImageBuffer(img);
              if (buf) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 }, children: [new ImageRun({ data: buf, transformation: { width: 500, height: 350 } })] }));
            }
          }
        }
      } else if (key === 'eventImages') {
        if (eventImages.length > 0) {
          children.push(makeSectionTitle('Event Images'));
          for (const img of eventImages) {
            const buf = getImageBuffer(img);
            if (buf) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new ImageRun({ data: buf, transformation: { width: 500, height: 350 } })] }));
          }
        }
      }
    }

    const doc = new Document({
      sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }]
    });

    const buffer = await Packer.toBuffer(doc);
    const sanitizedTitle = report.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}_Report.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (err) {
    console.error('Export DOCX error:', err);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
}

export async function exportPdf(req, res) {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const winnerGroups = JSON.parse(report.winnerGroups || '[]');
    const eventImages = JSON.parse(report.eventImages || '[]');
    const registrationImages = JSON.parse(report.registrationImages || '[]');
    const customSections = JSON.parse(report.customSections || '[]');

    const headerPath = path.join(templatesDir, report.headerImage || 'header-1.png');
    const headerSrc = fs.existsSync(headerPath) ? `data:image/png;base64,${fs.readFileSync(headerPath).toString('base64')}` : '';

    function winnersHtml(entries) {
      let h = '<table><thead><tr><th>Place</th><th>Name</th><th>Roll Number</th><th>Class/Sec</th><th>Phone</th></tr></thead><tbody>';
      for (const w of (entries || [])) {
        h += `<tr><td>${w.place || ''}</td><td>${w.name || ''}</td><td>${w.rollNumber || ''}</td><td>${w.classSec || ''}</td><td>${w.phone || ''}</td></tr>`;
      }
      return h + '</tbody></table>';
    }

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Times New Roman', Times, serif; color: #2C2C2C; padding: 40px; }
      .header-img { width: 100%; max-height: 120px; object-fit: contain; }
      .separator { border-bottom: 2px solid #1B3A5C; margin: 15px 0 25px; }
      h1 { font-family: 'Times New Roman', Times, serif; text-align: center; color: #1B3A5C; font-size: 28px; margin-bottom: 5px; }
      .date { text-align: center; color: #666; margin-bottom: 25px; font-size: 14px; }
      h2 { font-family: 'Times New Roman', Times, serif; color: #1B3A5C; font-size: 20px; margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
      .desc { line-height: 1.7; margin-bottom: 15px; font-size: 14px; }
      .desc-italic { font-style: italic; margin-bottom: 10px; font-size: 13px; color: #555; }
      .img-center { text-align: center; margin: 15px 0; }
      .img-center img { max-width: 90%; max-height: 500px; border-radius: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th { background: #1B3A5C; color: white; padding: 10px; font-size: 13px; }
      td { border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 13px; }
      tr:nth-child(even) { background: #f5f5f5; }
      .event-images { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
      .event-images img { width: 45%; border-radius: 4px; }
    </style></head><body>`;

    const sectionOrder = JSON.parse(report.sectionOrder || '["description", "poster", "registration", "winnerGroups", "customSections", "eventImages"]');

    if (headerSrc) html += `<img class="header-img" src="${headerSrc}" /><div class="separator"></div>`;
    html += `<h1>${report.title}</h1>`;
    html += `<p class="date">Date: ${new Date(report.eventDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`;

    for (const key of sectionOrder) {
      if (key === 'description') {
        if (report.description) html += `<h2>Circular / Description</h2><p class="desc">${report.description}</p>`;
        if (report.circularImage) { const s = imageToBase64(report.circularImage); if (s) html += `<div class="img-center"><img src="${s}" /></div>`; }
      } else if (key === 'poster') {
        if (report.posterImage) { html += `<h2>Event Poster</h2>`; const s = imageToBase64(report.posterImage); if (s) html += `<div class="img-center"><img src="${s}" /></div>`; }
      } else if (key === 'registration') {
        if (registrationImages.length > 0) {
          html += `<h2>Registration Sheets</h2>`;
          for (const img of registrationImages) { const s = imageToBase64(img); if (s) html += `<div class="img-center"><img src="${s}" /></div>`; }
        }
      } else if (key === 'winnerGroups') {
        for (const group of winnerGroups) {
          html += `<h2>${group.title || 'Winners'}</h2>`;
          if (group.description) html += `<p class="desc-italic">${group.description}</p>`;
          if (group.entries && group.entries.length > 0) html += winnersHtml(group.entries);
        }
      } else if (key === 'customSections') {
        for (const section of customSections) {
          html += `<h2>${section.title || 'Additional Section'}</h2>`;
          if (section.content) html += `<p class="desc">${section.content}</p>`;
          if (section.images && section.images.length > 0) {
            for (const img of section.images) { const s = imageToBase64(img); if (s) html += `<div class="img-center"><img src="${s}" /></div>`; }
          }
        }
      } else if (key === 'eventImages') {
        if (eventImages.length > 0) {
          html += `<h2>Event Images</h2><div class="event-images">`;
          for (const img of eventImages) { const s = imageToBase64(img); if (s) html += `<img src="${s}" />`; }
          html += `</div>`;
        }
      }
    }

    html += `</body></html>`;

    // Use puppeteer for PDF
    let puppeteer;
    try {
      puppeteer = await import('puppeteer');
    } catch (e) {
      // Fallback: return HTML as downloadable PDF-like file
      console.warn('Puppeteer not available, trying puppeteer-core...');
      try {
        puppeteer = await import('puppeteer-core');
      } catch (e2) {
        // Last fallback: send HTML file
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
    }

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });
    await browser.close();

    const sanitizedTitle = report.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}_Report.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Export PDF error:', err);
    res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
  }
}
