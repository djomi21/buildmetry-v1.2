const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { createTransporter } = require('../utils/mailer');
const crypto = require('crypto');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.estimate.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const items = await prisma.estimate.findMany({
      where: { companyId: req.companyId, projId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.estimate.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { createdAt, updatedAt, company, customer, project, estimate, _id, ...clean } = req.body;
    if (clean.custId) {
      const cust = await prisma.customer.findUnique({ where: { id: Number(clean.custId) } });
      if (!cust) clean.custId = null;
    }
    if (clean.projId) {
      const proj = await prisma.project.findUnique({ where: { id: clean.projId } });
      if (!proj) clean.projId = null;
    }
    const item = await prisma.estimate.create({ data: { ...clean, companyId: req.companyId } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, companyId, company, customer, project, estimate, _id, ...clean } = req.body;
    const item = await prisma.estimate.update({ where: { id: req.params.id }, data: clean });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.estimate.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════
// POST /api/estimates/:id/send-approval
// Generate token and email signing link to customer
// ═══════════════════════════════════════════════════
router.post('/:id/send-approval', authenticate, async (req, res) => {
  try {
    const { toEmail, message } = req.body;
    if (!toEmail) return res.status(400).json({ error: 'Recipient email required.' });

    const estimate = await prisma.estimate.findFirst({
      where: { id: req.params.id, companyId: req.companyId },
      include: { customer: true }
    });
    if (!estimate) return res.status(404).json({ error: 'Estimate not found.' });

    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company || !company.smtpHost || !company.smtpUser) {
      return res.status(400).json({ error: 'SMTP not configured. Go to Company Setup > Email & Notifications.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.estimate.update({
      where: { id: req.params.id },
      data: { signToken: token, signTokenExpiry: expiry, status: 'sent' }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://app.buildmetry.com';
    const signingUrl = frontendUrl + '/sign/' + token;

    const subject = company.emailSubjectEstimate
      ? company.emailSubjectEstimate.replace('{number}', estimate.number).replace('{name}', estimate.name)
      : 'Please review and approve: ' + estimate.name;

    const body = (message ? message + '\n\n' : '')
      + 'Please review and approve your estimate by clicking the link below:\n\n'
      + signingUrl
      + '\n\nThis link expires in 30 days.\n\n'
      + (company.emailSignature || company.name || '');

    const transporter = createTransporter(company);
    await transporter.sendMail({
      from: '"' + (company.emailFromName || company.name) + '" <' + company.smtpUser + '>',
      to: toEmail,
      replyTo: company.emailReplyTo || company.smtpUser,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    });

    try {
      await prisma.emailLog.create({
        data: {
          companyId: req.companyId,
          type: 'estimate-signature',
          docId: estimate.id,
          toEmail,
          subject,
          body,
          status: 'sent',
          sentBy: req.user.id,
        }
      });
    } catch (logErr) { /* non-fatal */ }

    res.json({ success: true, signingUrl, status: 'sent' });
  } catch (err) {
    console.error('Send approval error:', err);
    res.status(500).json({ error: 'Failed to send: ' + err.message });
  }
});

module.exports = router;
