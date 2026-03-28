const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');

// GET all tasks for company
router.get('/', authenticate, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { companyId: req.companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
router.post('/', authenticate, async (req, res) => {
  try {
    const data = { ...req.body, companyId: req.companyId };
    // Keep string IDs
    if (typeof data.id === 'number') delete data.id;
    const task = await prisma.task.create({ data });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const allowed = ['phase', 'title', 'assignedTo', 'status', 'dueDate', 'notes'];
    const data = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
