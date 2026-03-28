const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.project.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await prisma.project.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { createdAt, updatedAt, company, customer, project, _id, ...clean } = req.body;
    if (clean.custId) {
      const cust = await prisma.customer.findUnique({ where: { id: Number(clean.custId) } });
      if (!cust) clean.custId = null;
    }
    const item = await prisma.project.create({ data: { ...clean, companyId: req.companyId } });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id, createdAt, updatedAt, companyId, company, customer, project, _id, ...clean } = req.body;
    const item = await prisma.project.update({ where: { id: req.params.id }, data: clean });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
