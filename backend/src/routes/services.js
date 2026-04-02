const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/services
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.service.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/services/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.service.findFirst({ where: { id: Number(req.params.id), companyId: req.companyId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/services
router.post('/', authenticate, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, company, ...clean } = req.body;
    const item = await prisma.service.create({ data: { ...clean, companyId: req.companyId } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/services/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.service.update({
      where: { id: Number(req.params.id) },
      data: (() => { const { id, createdAt, updatedAt, companyId, company, ...clean } = req.body; return clean; })(),
    });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/services/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
