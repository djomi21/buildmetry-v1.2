const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/exclusion-templates
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.exclusionTemplate.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/exclusion-templates/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.exclusionTemplate.findFirst({ where: { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id), companyId: req.companyId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/exclusion-templates
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, company, ...clean } = req.body;
    const item = await prisma.exclusionTemplate.create({ data: { ...clean, companyId: req.companyId } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/exclusion-templates/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.exclusionTemplate.update({
      where: { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) },
      data: (() => { const { id, createdAt, updatedAt, companyId, company, ...clean } = req.body; return clean; })(),
    });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/exclusion-templates/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.exclusionTemplate.delete({ where: { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
