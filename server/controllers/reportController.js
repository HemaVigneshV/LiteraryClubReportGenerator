import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import supabase from '../config/db.js';

function parseReport(r) {
  if (!r) return null;
  return {
    ...r,
    eventImages: typeof r.eventImages === 'string' ? JSON.parse(r.eventImages || '[]') : r.eventImages,
    registrationImages: typeof r.registrationImages === 'string' ? JSON.parse(r.registrationImages || '[]') : r.registrationImages,
    winnerGroups: typeof r.winnerGroups === 'string' ? JSON.parse(r.winnerGroups || '[]') : r.winnerGroups,
    customSections: typeof r.customSections === 'string' ? JSON.parse(r.customSections || '[]') : r.customSections,
    sectionOrder: typeof r.sectionOrder === 'string' ? JSON.parse(r.sectionOrder || '["description", "poster", "registration", "winnerGroups", "customSections", "eventImages"]') : r.sectionOrder
  };
}

async function uploadToSupabase(file) {
  if (!file) return null;
  const ext = file.originalname.split('.').pop();
  const uniqueName = `${uuidv4()}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(uniqueName, file.buffer, { contentType: file.mimetype });
  if (error) throw error;
  return uniqueName;
}

export async function getAllReports(req, res) {
  try {
    let query = supabase.from('reports').select('*').order('updatedAt', { ascending: false });
    if (req.user.role !== 'admin') query = query.eq('createdBy', req.user.id);
    
    const { data: reports, error } = await query;
    if (error) throw error;
    res.json({ reports: (reports || []).map(parseReport) });
  } catch (err) {
    console.error('GetAllReports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getReport(req, res) {
  try {
    const { data: report, error } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (error || !report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.role !== 'admin' && report.createdBy !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    res.json({ report: parseReport(report) });
  } catch (err) {
    console.error('GetReport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getReportByShareCode(req, res) {
  try {
    const { data: report, error } = await supabase.from('reports').select('*').eq('shareCode', req.params.code).single();
    if (error || !report) return res.status(404).json({ error: 'Invalid share code' });
    res.json({ report: parseReport(report) });
  } catch (err) {
    console.error('GetReportByShareCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateReportByShareCode(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('shareCode', req.params.code).single();
    if (findError || !report) return res.status(404).json({ error: 'Invalid share code' });

    const { title, eventDate, description, headerImage, winnerGroups, customSections, sectionOrder } = req.body;
    const files = req.files || {};

    const circularImage = files.circularImage ? await uploadToSupabase(files.circularImage[0]) : report.circularImage;
    const posterImage = files.posterImage ? await uploadToSupabase(files.posterImage[0]) : report.posterImage;

    let registrationImages = JSON.parse(report.registrationImages || '[]');
    if (files.registrationImages?.length > 0) {
      const newImages = await Promise.all(files.registrationImages.map(uploadToSupabase));
      const existing = req.body.existingRegistrationImages;
      if (existing) { try { registrationImages = JSON.parse(existing); } catch(e) { registrationImages = []; } }
      registrationImages = [...registrationImages, ...newImages];
    } else if (req.body.existingRegistrationImages) {
      try { registrationImages = JSON.parse(req.body.existingRegistrationImages); } catch(e) {}
    }

    let eventImages = JSON.parse(report.eventImages || '[]');
    if (files.eventImages?.length > 0) {
      const newImages = await Promise.all(files.eventImages.map(uploadToSupabase));
      const existing = req.body.existingEventImages;
      if (existing) { try { eventImages = JSON.parse(existing); } catch(e) { eventImages = []; } }
      eventImages = [...eventImages, ...newImages];
    } else if (req.body.existingEventImages) {
      try { eventImages = JSON.parse(req.body.existingEventImages); } catch(e) {}
    }

    const { data: updated, error: updateError } = await supabase.from('reports').update({
      title: title || report.title,
      eventDate: eventDate || report.eventDate,
      description: description !== undefined ? description : report.description,
      headerImage: headerImage || report.headerImage,
      circularImage, posterImage,
      registrationImages: JSON.stringify(registrationImages),
      eventImages: JSON.stringify(eventImages),
      winnerGroups: winnerGroups || report.winnerGroups,
      customSections: customSections || report.customSections,
      sectionOrder: sectionOrder || report.sectionOrder,
      updatedAt: new Date().toISOString()
    }).eq('shareCode', req.params.code).select().single();

    if (updateError) throw updateError;
    res.json({ report: parseReport(updated) });
  } catch (err) {
    console.error('UpdateReportByShareCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createReport(req, res) {
  try {
    const { title, eventDate, description, headerImage, winnerGroups, customSections, sectionOrder } = req.body;
    if (!title || !eventDate) return res.status(400).json({ error: 'Title and event date are required' });

    const id = uuidv4();
    const files = req.files || {};
    
    const circularImage = files.circularImage ? await uploadToSupabase(files.circularImage[0]) : null;
    const posterImage = files.posterImage ? await uploadToSupabase(files.posterImage[0]) : null;
    
    const registrationImages = files.registrationImages ? await Promise.all(files.registrationImages.map(uploadToSupabase)) : [];
    const eventImages = files.eventImages ? await Promise.all(files.eventImages.map(uploadToSupabase)) : [];

    const { data: report, error } = await supabase.from('reports').insert([{
      id, title, eventDate, description: description || '', headerImage: headerImage || 'header-1.png',
      circularImage, posterImage, registrationImages: JSON.stringify(registrationImages), eventImages: JSON.stringify(eventImages),
      winnerGroups: winnerGroups || '[]', customSections: customSections || '[]',
      sectionOrder: sectionOrder || '["description", "poster", "registration", "winners", "custom", "event_images"]',
      createdBy: req.user.id, creatorName: req.user.fullName
    }]).select().single();

    if (error) throw error;
    res.status(201).json({ report: parseReport(report) });
  } catch (err) {
    console.error('CreateReport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateReport(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });

    if (req.user.role !== 'admin') {
      if (report.createdBy !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      if (!['draft', 'rejected'].includes(report.status)) return res.status(403).json({ error: 'Can only edit draft or rejected reports' });
    }

    const { title, eventDate, description, headerImage, winnerGroups, customSections, sectionOrder } = req.body;
    const files = req.files || {};

    const circularImage = files.circularImage ? await uploadToSupabase(files.circularImage[0]) : report.circularImage;
    const posterImage = files.posterImage ? await uploadToSupabase(files.posterImage[0]) : report.posterImage;

    let registrationImages = JSON.parse(report.registrationImages || '[]');
    if (files.registrationImages?.length > 0) {
      const newImages = await Promise.all(files.registrationImages.map(uploadToSupabase));
      const existing = req.body.existingRegistrationImages;
      if (existing) { try { registrationImages = JSON.parse(existing); } catch(e) { registrationImages = []; } }
      registrationImages = [...registrationImages, ...newImages];
    } else if (req.body.existingRegistrationImages) {
      try { registrationImages = JSON.parse(req.body.existingRegistrationImages); } catch(e) {}
    }

    let eventImages = JSON.parse(report.eventImages || '[]');
    if (files.eventImages?.length > 0) {
      const newImages = await Promise.all(files.eventImages.map(uploadToSupabase));
      const existing = req.body.existingEventImages;
      if (existing) { try { eventImages = JSON.parse(existing); } catch(e) { eventImages = []; } }
      eventImages = [...eventImages, ...newImages];
    } else if (req.body.existingEventImages) {
      try { eventImages = JSON.parse(req.body.existingEventImages); } catch(e) {}
    }

    const { data: updated, error: updateError } = await supabase.from('reports').update({
      title: title || report.title,
      eventDate: eventDate || report.eventDate,
      description: description !== undefined ? description : report.description,
      headerImage: headerImage || report.headerImage,
      circularImage, posterImage,
      registrationImages: JSON.stringify(registrationImages),
      eventImages: JSON.stringify(eventImages),
      winnerGroups: winnerGroups || report.winnerGroups,
      customSections: customSections || report.customSections,
      sectionOrder: sectionOrder || report.sectionOrder,
      updatedAt: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (updateError) throw updateError;
    res.json({ report: parseReport(updated) });
  } catch (err) {
    console.error('UpdateReport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function generateShareCode(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.role !== 'admin' && report.createdBy !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    if (report.shareCode) return res.json({ shareCode: report.shareCode });

    const shareCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const { error } = await supabase.from('reports').update({ shareCode }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ shareCode });
  } catch (err) {
    console.error('GenerateShareCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokeShareCode(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });
    if (req.user.role !== 'admin' && report.createdBy !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { error } = await supabase.from('reports').update({ shareCode: null }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Share code revoked' });
  } catch (err) {
    console.error('RevokeShareCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function submitReport(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });
    if (report.createdBy !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    if (!['draft', 'rejected'].includes(report.status)) return res.status(400).json({ error: 'Can only submit draft or rejected reports' });

    const { data: updated, error } = await supabase.from('reports').update({ status: 'pending', rejectionNote: null, updatedAt: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ report: parseReport(updated) });
  } catch (err) { console.error('SubmitReport error:', err); res.status(500).json({ error: 'Internal server error' }); }
}

export async function approveReport(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });

    const { data: updated, error } = await supabase.from('reports').update({ status: 'approved', rejectionNote: null, updatedAt: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ report: parseReport(updated) });
  } catch (err) { console.error('ApproveReport error:', err); res.status(500).json({ error: 'Internal server error' }); }
}

export async function rejectReport(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });

    const { data: updated, error } = await supabase.from('reports').update({ status: 'rejected', rejectionNote: req.body.rejectionNote || 'No reason provided', updatedAt: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ report: parseReport(updated) });
  } catch (err) { console.error('RejectReport error:', err); res.status(500).json({ error: 'Internal server error' }); }
}

export async function deleteReport(req, res) {
  try {
    const { data: report, error: findError } = await supabase.from('reports').select('*').eq('id', req.params.id).single();
    if (findError || !report) return res.status(404).json({ error: 'Report not found' });

    const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Report deleted successfully' });
  } catch (err) { console.error('DeleteReport error:', err); res.status(500).json({ error: 'Internal server error' }); }
}

export async function uploadReportDocument(req, res) {
  try {
    const { title, eventDate } = req.body;
    if (!title || !eventDate || !req.file) return res.status(400).json({ error: 'Title, event date, and document file are required' });

    const id = uuidv4();
    const uploadedWordFile = await uploadToSupabase(req.file);

    const { data: report, error } = await supabase.from('reports').insert([{
      id, title, eventDate, description: 'Report created from uploaded document.', headerImage: 'header-1.png',
      registrationImages: '[]', eventImages: '[]', winnerGroups: '[]', customSections: '[]',
      sectionOrder: '["description", "poster", "registration", "winners", "custom", "event_images"]',
      uploadedWordFile, createdBy: req.user.id, creatorName: req.user.fullName
    }]).select().single();

    if (error) throw error;
    res.status(201).json({ report: parseReport(report) });
  } catch (err) {
    console.error('UploadReportDocument error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
