const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

var ALLOWED = [
  'name','owner','phone','email','address','website','license','ein','logo',
  'defaultTaxRate','paymentTerms','laborBurdenDefault','invoiceFooter','estimateFooter',
  'smtpHost','smtpPort','smtpUser','smtpPass','smtpSecure',
  'emailFromName','emailReplyTo','emailSignature',
  'emailSubjectEstimate','emailSubjectInvoice','emailBodyEstimate','emailBodyInvoice',
  'notifyEstimateSent','notifyEstimateApproved','notifyEstimateDeclined',
  'notifyInvoiceSent','notifyInvoicePaid','notifyInvoiceOverdue','notifyPaymentReminder',
  'reminderDaysBefore','overdueFollowupDays',
  'themeAccent','themeName'
];

function pickAllowed(body) {
  var clean = {};
  ALLOWED.forEach(function(key) {
    if (body[key] !== undefined) clean[key] = body[key];
  });
  return clean;
}

// GET /api/company
router.get('/', authenticate, async (req, res) => {
  try {
    var company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    console.error('GET company error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/company — uses companyId from JWT token
router.put('/', authenticate, async (req, res) => {
  try {
    var data = pickAllowed(req.body);
    console.log('UPDATE company id=' + req.companyId + ', fields:', Object.keys(data));
    var company = await prisma.company.update({
      where: { id: req.companyId },
      data: data
    });
    res.json(company);
  } catch (err) {
    console.error('PUT company error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/company/:id — fallback for old clients
router.put('/:id', authenticate, async (req, res) => {
  try {
    var data = pickAllowed(req.body);
    var company = await prisma.company.update({
      where: { id: Number(req.params.id) || req.companyId },
      data: data
    });
    res.json(company);
  } catch (err) {
    console.error('PUT company/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
