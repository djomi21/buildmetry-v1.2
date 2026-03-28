const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');

// GET all phases for company (ordered)
router.get('/', authenticate, async (req, res) => {
  try {
    const phases = await prisma.projectPhase.findMany({
      where: { companyId: req.companyId },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(phases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create phase
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, sortOrder } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Phase name required' });
    const maxOrder = await prisma.projectPhase.findFirst({
      where: { companyId: req.companyId },
      orderBy: { sortOrder: 'desc' }
    });
    const phase = await prisma.projectPhase.create({
      data: {
        companyId: req.companyId,
        name: name.trim(),
        sortOrder: sortOrder ?? (maxOrder ? maxOrder.sortOrder + 1 : 0)
      }
    });
    res.json(phase);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Phase already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update phase (rename or reorder)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name.trim();
    if (req.body.sortOrder !== undefined) data.sortOrder = req.body.sortOrder;
    const phase = await prisma.projectPhase.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(phase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT bulk reorder
router.put('/reorder/bulk', authenticate, async (req, res) => {
  try {
    const { phases } = req.body; // [{id, sortOrder}]
    if (!Array.isArray(phases)) return res.status(400).json({ error: 'phases array required' });
    await Promise.all(phases.map(p =>
      prisma.projectPhase.update({ where: { id: p.id }, data: { sortOrder: p.sortOrder } })
    ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE phase
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.projectPhase.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
