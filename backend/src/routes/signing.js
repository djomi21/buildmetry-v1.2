// ─────────────────────────────────────────────────────────────────
// PUBLIC E-SIGNATURE ROUTES — NO AUTHENTICATION REQUIRED
// GET  /api/sign/:token          — fetch document for signing
// POST /api/sign/:token/accept   — customer accepts/signs
// POST /api/sign/:token/decline  — customer declines
// ─────────────────────────────────────────────────────────────────
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { createTransporter } = require('../utils/mailer');
const router = express.Router();
const prisma = new PrismaClient();

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

function calcTotals(items, discountPercent, taxRate, retentionPercent) {
  var sub = (items || []).reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  var mat = (items || []).filter(i => i.isMaterial).reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  var lab = sub - mat;
  var da = sub * (discountPercent / 100);
  var dm = mat * (1 - discountPercent / 100);
  var tax = dm * (taxRate || 0);
  var tot = (sub - da) + tax;
  var ra = tot * ((retentionPercent || 0) / 100);
  return { sub, lab, mat, da, dm, tax, tot, ra, net: tot - ra };
}

async function findDocByToken(token) {
  var contract = await prisma.contract.findUnique({
    where: { signToken: token },
    include: { project: true }
  });
  if (contract) return { docType: 'contract', doc: contract, companyId: contract.project?.companyId };

  var estimate = await prisma.estimate.findUnique({
    where: { signToken: token },
    include: { customer: true }
  });
  if (estimate) return { docType: 'estimate', doc: estimate, companyId: estimate.companyId };

  return null;
}

async function sendNotificationEmail(company, docType, doc, signerName, action) {
  if (!company || !company.smtpHost || !company.smtpUser) return;
  try {
    var transporter = createTransporter(company);
    var title = docType === 'contract' ? doc.title : doc.name;
    var clientName = docType === 'contract' ? doc.clientOrSubName : (doc.customer?.name || 'Customer');
    var actionWord = action === 'accepted' ? 'signed' : 'declined';
    var subject = clientName + ' ' + actionWord + ' your ' + (docType === 'contract' ? 'Contract' : 'Estimate') + ': ' + title;
    var body = 'BuildMetry E-Signature Notification\n\n'
      + (action === 'accepted'
        ? '✓ ' + signerName + ' has signed "' + title + '".\n\n'
          + 'Signed by: ' + signerName + '\n'
          + 'Date/Time: ' + new Date().toLocaleString() + '\n'
        : '✗ ' + clientName + ' declined "' + title + '".\n\n'
          + 'Date/Time: ' + new Date().toLocaleString() + '\n')
      + '\nLog in to BuildMetry to view the document.';

    var toEmail = company.emailReplyTo || company.smtpUser;
    await transporter.sendMail({
      from: '"' + (company.emailFromName || company.name) + '" <' + company.smtpUser + '>',
      to: toEmail,
      subject: subject,
      text: body,
    });
  } catch (err) {
    console.error('Signing notification email failed:', err.message);
  }
}

// ═══════════════════════════════════════════════════
// GET /api/sign/:token — public document fetch
// ═══════════════════════════════════════════════════
router.get('/:token', async (req, res) => {
  try {
    var result = await findDocByToken(req.params.token);
    if (!result) return res.status(404).json({ error: 'Signing link not found.' });

    var { docType, doc, companyId } = result;

    if (doc.signTokenExpiry && new Date() > new Date(doc.signTokenExpiry)) {
      return res.status(410).json({ error: 'This signing link has expired.' });
    }

    var company = companyId ? await prisma.company.findUnique({ where: { id: companyId } }) : null;

    var totals = null;
    if (docType === 'contract') {
      totals = calcTotals(doc.lineItems || [], doc.discountPercent || 0, doc.taxRate || 0.065, doc.retentionPercent || 0);
    } else {
      // Estimate uses percent tax rate (6.5 stored as 6.5, not 0.065)
      var tr = (doc.taxRate || 6.5) / 100;
      totals = calcTotals(doc.lineItems || [], doc.discount || 0, tr, 0);
    }

    return res.json({
      docType,
      docId: doc.id,
      title: docType === 'contract' ? doc.title : doc.name,
      clientOrSubName: docType === 'contract' ? doc.clientOrSubName : (doc.customer?.name || ''),
      lineItems: doc.lineItems || [],
      totals,
      scopeOfWork: docType === 'contract' ? (doc.scopeOfWork || '') : (doc.notes || ''),
      exclusions: docType === 'contract' ? (doc.exclusions || '') : '',
      milestones: docType === 'contract' ? (doc.milestones || []) : [],
      paymentTerms: docType === 'contract' ? doc.paymentTerms : '',
      status: doc.status,
      signatureStatus: doc.signatureStatus || null,
      signedAt: doc.signedAt || null,
      signedByName: doc.signedByName || null,
      companyName: company?.name || '',
      companyLogo: company?.logo || null,
      companyPhone: company?.phone || '',
      companyEmail: company?.smtpUser || '',
      companyAddress: company?.address || '',
    });
  } catch (err) {
    console.error('Sign GET error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/sign/:token/accept
// ═══════════════════════════════════════════════════
router.post('/:token/accept', async (req, res) => {
  try {
    var { signerName, signatureImage } = req.body;
    if (!signerName || !signerName.trim()) {
      return res.status(400).json({ error: 'Signer name is required.' });
    }

    var result = await findDocByToken(req.params.token);
    if (!result) return res.status(404).json({ error: 'Signing link not found.' });

    var { docType, doc, companyId } = result;

    if (doc.signTokenExpiry && new Date() > new Date(doc.signTokenExpiry)) {
      return res.status(410).json({ error: 'This signing link has expired.' });
    }
    if (doc.signedAt) {
      return res.status(409).json({ error: 'This document has already been signed.', signedAt: doc.signedAt, signedByName: doc.signedByName });
    }

    var ip = getClientIp(req);
    var now = new Date();

    if (docType === 'contract') {
      await prisma.contract.update({
        where: { id: doc.id },
        data: {
          signedAt: now,
          signedByName: signerName.trim(),
          signedByIp: ip,
          signatureImage: signatureImage || null,
          signatureStatus: 'Fully Executed',
          status: 'Active',
        }
      });
    } else {
      await prisma.estimate.update({
        where: { id: doc.id },
        data: {
          signedAt: now,
          signedByName: signerName.trim(),
          signedByIp: ip,
          signatureImage: signatureImage || null,
          status: 'approved',
        }
      });
    }

    // Log to EmailLog
    var company = companyId ? await prisma.company.findUnique({ where: { id: companyId } }) : null;
    if (company) {
      try {
        await prisma.emailLog.create({
          data: {
            companyId: companyId,
            type: docType === 'contract' ? 'contract-signed' : 'estimate-signed',
            docId: String(doc.id),
            toEmail: company.emailReplyTo || company.smtpUser || '',
            subject: signerName.trim() + ' signed ' + (docType === 'contract' ? doc.title : doc.name),
            body: 'Signed by: ' + signerName.trim() + ' | IP: ' + ip,
            status: 'sent',
          }
        });
      } catch (logErr) { /* non-fatal */ }

      await sendNotificationEmail(company, docType, doc, signerName.trim(), 'accepted');
    }

    res.json({ success: true, signedAt: now, signerName: signerName.trim() });
  } catch (err) {
    console.error('Sign accept error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/sign/:token/decline
// ═══════════════════════════════════════════════════
router.post('/:token/decline', async (req, res) => {
  try {
    var result = await findDocByToken(req.params.token);
    if (!result) return res.status(404).json({ error: 'Signing link not found.' });

    var { docType, doc, companyId } = result;

    if (doc.signTokenExpiry && new Date() > new Date(doc.signTokenExpiry)) {
      return res.status(410).json({ error: 'This signing link has expired.' });
    }
    if (doc.signedAt) {
      return res.status(409).json({ error: 'This document has already been signed.' });
    }

    if (docType === 'contract') {
      await prisma.contract.update({
        where: { id: doc.id },
        data: { signatureStatus: 'Declined', status: 'Cancelled' }
      });
    } else {
      await prisma.estimate.update({
        where: { id: doc.id },
        data: { status: 'declined' }
      });
    }

    var company = companyId ? await prisma.company.findUnique({ where: { id: companyId } }) : null;
    if (company) {
      await sendNotificationEmail(company, docType, doc, '', 'declined');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Sign decline error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
