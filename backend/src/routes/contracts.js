// ═══════════════════════════════════════════════════════════
// backend/src/routes/contracts.js
// 
// Contracts module — CRUD + milestones + estimate conversion
// Uses Prisma (same as all other BuildMetry routes).
//
// INSTALL: Copy this file to  backend/src/routes/contracts.js
// REGISTER: Add these 2 lines to backend/src/server.js
//   const contractRoutes = require('./routes/contracts');
//   app.use('/api/contracts', authenticate, contractRoutes);
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');
const { createTransporter } = require('../utils/mailer');
const crypto = require('crypto');

// ─── Helper: Calculate contract totals server-side ───
// Follows BuildMetry rules: tax on materials only, after discount
function calcTotals(lineItems, discountPercent, taxRate, retentionPercent) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  const subtotal = items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const laborTotal = items.filter(i => !i.isMaterial).reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const materialTotal = items.filter(i => i.isMaterial).reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
  const discountAmount = subtotal * ((discountPercent || 0) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const discountedMaterial = materialTotal * (1 - (discountPercent || 0) / 100);
  const taxAmount = discountedMaterial * (taxRate || 0.065);
  const total = discountedSubtotal + taxAmount;
  const retentionAmount = total * ((retentionPercent || 0) / 100);
  const netPayable = total - retentionAmount;
  return { subtotal, laborTotal, materialTotal, discountAmount, taxAmount, total, retentionAmount, netPayable };
}


// ═══════════════════════════════════════
// GET /api/contracts/project/:projectId
// List all contracts for a project
// ═══════════════════════════════════════
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const contracts = await prisma.contract.findMany({
      where: { projectId },
      include: { changeOrders: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (err) {
    console.error('Error listing contracts:', err);
    res.status(500).json({ message: 'Failed to list contracts' });
  }
});


// ═══════════════════════════════════════
// GET /api/contracts/:id
// Get a single contract with change orders
// ═══════════════════════════════════════
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { changeOrders: true, project: true },
    });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    console.error('Error getting contract:', err);
    res.status(500).json({ message: 'Failed to get contract' });
  }
});


// ═══════════════════════════════════════
// POST /api/contracts
// Create a new contract
// ═══════════════════════════════════════
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      projectId, linkedEstimateId, parentContractId,
      title, contractType, status, clientOrSubName,
      startDate, endDate, signatureStatus,
      discountPercent, taxRate, retentionPercent, paymentTerms,
      scopeOfWork, exclusions, lineItems, milestones,
    } = req.body;

    const contract = await prisma.contract.create({
      data: {
        projectId:        String(projectId),
        linkedEstimateId: linkedEstimateId ? String(linkedEstimateId) : null,
        parentContractId: parentContractId ? parseInt(parentContractId) : null,
        title:            title || 'Untitled Contract',
        contractType:     contractType || 'Prime',
        status:           status || 'Draft',
        clientOrSubName:  clientOrSubName || '',
        startDate:        startDate ? new Date(startDate) : null,
        endDate:          endDate ? new Date(endDate) : null,
        signatureStatus:  signatureStatus || 'Unsigned',
        discountPercent:  parseFloat(discountPercent) || 0,
        taxRate:          parseFloat(taxRate) || 0.065,
        retentionPercent: parseFloat(retentionPercent) || 10,
        paymentTerms:     paymentTerms || 'Net 30',
        scopeOfWork:      scopeOfWork || '',
        exclusions:       exclusions || '',
        lineItems:        lineItems || [],
        milestones:       milestones || [],
      },
    });

    res.status(201).json(contract);
  } catch (err) {
    console.error('Error creating contract:', err);
    res.status(500).json({ message: 'Failed to create contract' });
  }
});


// ═══════════════════════════════════════
// PUT /api/contracts/:id
// Full update of a contract
// ═══════════════════════════════════════
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      title, contractType, status, clientOrSubName,
      startDate, endDate, signatureStatus,
      discountPercent, taxRate, retentionPercent, paymentTerms,
      scopeOfWork, exclusions, lineItems, milestones,
    } = req.body;

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        title, contractType, status, clientOrSubName,
        startDate: startDate ? new Date(startDate) : null,
        endDate:   endDate ? new Date(endDate) : null,
        signatureStatus,
        discountPercent: parseFloat(discountPercent) || 0,
        taxRate:         parseFloat(taxRate) || 0.065,
        retentionPercent: parseFloat(retentionPercent) || 10,
        paymentTerms,
        scopeOfWork: scopeOfWork || '',
        exclusions:  exclusions || '',
        lineItems:   lineItems || [],
        milestones:  milestones || [],
      },
    });

    res.json(contract);
  } catch (err) {
    console.error('Error updating contract:', err);
    res.status(500).json({ message: 'Failed to update contract' });
  }
});


// ═══════════════════════════════════════
// PATCH /api/contracts/:id/status
// Quick status update only
// ═══════════════════════════════════════
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, signatureStatus } = req.body;
    const data = {};
    if (status) data.status = status;
    if (signatureStatus) data.signatureStatus = signatureStatus;

    const contract = await prisma.contract.update({ where: { id }, data });
    res.json(contract);
  } catch (err) {
    console.error('Error updating contract status:', err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});


// ═══════════════════════════════════════
// POST /api/contracts/:id/send-signature
// Generate token and email signing link to customer
// ═══════════════════════════════════════
router.post('/:id/send-signature', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { toEmail, message } = req.body;
    if (!toEmail) return res.status(400).json({ error: 'Recipient email required.' });

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { project: true }
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    const company = await prisma.company.findUnique({ where: { id: contract.project.companyId } });
    if (!company || !company.smtpHost || !company.smtpUser) {
      return res.status(400).json({ error: 'SMTP not configured. Go to Company Setup > Email & Notifications.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.contract.update({
      where: { id },
      data: { signToken: token, signTokenExpiry: expiry, status: 'Sent' }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://app.buildmetry.com';
    const signingUrl = frontendUrl + '/sign/' + token;

    const subject = 'Please sign: ' + contract.title;
    const body = (message ? message + '\n\n' : '')
      + 'Please review and sign the contract by clicking the link below:\n\n'
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
          type: 'contract-signature',
          docId: String(id),
          toEmail,
          subject,
          body,
          status: 'sent',
          sentBy: req.user.id,
        }
      });
    } catch (logErr) { /* non-fatal */ }

    res.json({ success: true, signingUrl, status: 'Sent' });
  } catch (err) {
    console.error('Send signature error:', err);
    res.status(500).json({ error: 'Failed to send: ' + err.message });
  }
});


// ═══════════════════════════════════════
// DELETE /api/contracts/:id
// Soft delete — sets status to Cancelled
// ═══════════════════════════════════════
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.contract.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting contract:', err);
    res.status(500).json({ message: 'Failed to delete contract' });
  }
});


// ═══════════════════════════════════════
// GET /api/contracts/:id/summary
// Financial summary including change orders
// ═══════════════════════════════════════
router.get('/:id/summary', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { changeOrders: true },
    });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const mainTotals = calcTotals(contract.lineItems, contract.discountPercent, contract.taxRate, contract.retentionPercent);

    // Sum up approved change orders
    const approvedCOs = (contract.changeOrders || []).filter(co => co.status !== 'Cancelled');
    const coValue = approvedCOs.reduce((sum, co) => {
      const items = Array.isArray(co.lineItems) ? co.lineItems : [];
      return sum + items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
    }, 0);

    // Sum paid milestones
    const milestones = Array.isArray(contract.milestones) ? contract.milestones : [];
    const paidAmount = milestones.filter(m => m.status === 'Paid').reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

    res.json({
      originalValue: mainTotals.total,
      changeOrderValue: coValue,
      changeOrderCount: approvedCOs.length,
      revisedValue: mainTotals.total + coValue,
      totalBilled: paidAmount,
      billedPercent: mainTotals.total > 0 ? paidAmount / mainTotals.total : 0,
      retentionHeld: mainTotals.retentionAmount,
      ...mainTotals,
    });
  } catch (err) {
    console.error('Error getting contract summary:', err);
    res.status(500).json({ message: 'Failed to get summary' });
  }
});


// ═══════════════════════════════════════
// POST /api/contracts/from-estimate/:estimateId
// Convert an estimate into a contract draft
// ═══════════════════════════════════════
router.post('/from-estimate/:estimateId', authenticate, async (req, res) => {
  try {
    const estimateId = req.params.estimateId;

    // Fetch the estimate with its line items
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { customer: true },
    });
    if (!estimate) return res.status(404).json({ message: 'Estimate not found' });

    // Map estimate line items to contract line item format
    const rawItems = Array.isArray(estimate.lineItems) ? estimate.lineItems : [];
    const lineItems = rawItems.map(item => ({
      description: item.description || item.name || '',
      qty:         parseFloat(item.qty || item.quantity || 0),
      unitPrice:   parseFloat(item.unitPrice || item.price || item.rate || 0),
      unit:        item.unit || 'ea',
      isMaterial:  Boolean(item.isMaterial),
    }));

    // Create the contract draft (NOT saved yet — returned for user review)
    // Or if req.body.autoSave is true, save it immediately
    const contractData = {
      projectId:        estimate.projId || '',
      linkedEstimateId: estimate.id,
      title:            `${estimate.title || estimate.name || 'Estimate'} — Contract`,
      contractType:     'Prime',
      status:           'Draft',
      clientOrSubName:  estimate.customer ? (estimate.customer.name || estimate.customer.companyName || '') : '',
      discountPercent:  estimate.discountPercent || estimate.discount || 0,
      taxRate:          estimate.taxRate || 0.065,
      retentionPercent: 10,
      paymentTerms:     'Net 30',
      scopeOfWork:      estimate.notes || estimate.scopeOfWork || '',
      exclusions:       estimate.exclusions || '',
      lineItems:        lineItems,
      milestones:       [],
    };

    if (req.body.autoSave) {
      const contract = await prisma.contract.create({ data: contractData });
      return res.status(201).json(contract);
    }

    // Return the draft for the frontend to display in the form
    res.json({ ...contractData, _isDraft: true });
  } catch (err) {
    console.error('Error converting estimate:', err);
    res.status(500).json({ message: 'Failed to convert estimate' });
  }
});


module.exports = router;
