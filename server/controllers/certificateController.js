import asyncHandler from 'express-async-handler';
import Certificate from '../models/Certificate.js';

// @desc    Get all certificates for logged-in student
// @route   GET /api/certificates/my
// @access  Student
export const getMyCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ userId: req.user._id })
    .populate('assessmentId', 'language score percentage completedAt')
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: certs });
});

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
export const getCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id);
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  if (cert.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  await cert.populate('userId', 'name college');
  res.json({ success: true, data: cert });
});
