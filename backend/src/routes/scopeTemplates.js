const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/scope-templates
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.scopeTemplate.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/scope-templates/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.scopeTemplate.findFirst({ where: { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id), companyId: req.companyId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/scope-templates
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, company, ...clean } = req.body;
    const item = await prisma.scopeTemplate.create({ data: { ...clean, companyId: req.companyId } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/scope-templates/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.scopeTemplate.update({
      where: { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) },
      data: (() => { const { id, createdAt, updatedAt, companyId, company, ...clean } = req.body; return clean; })(),
    });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/scope-templates/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.scopeTemplate.delete({ where: { id: isNaN(req.params.id) ? req.params.id : Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
