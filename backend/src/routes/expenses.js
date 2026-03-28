const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.expense.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { id, createdAt, _id, ...clean } = req.body;
    if (clean.projId) {
      const proj = await prisma.project.findUnique({ where: { id: clean.projId } });
      if (!proj) clean.projId = null;
    }
    const item = await prisma.expense.create({ data: { ...clean, companyId: req.companyId } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id, createdAt, companyId, _id, ...clean } = req.body;
    const item = await prisma.expense.update({ where: { id: Number(req.params.id) }, data: clean });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
