import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  res.status(201).json({ message: 'School-years route fonctionne !', received: req.body });
});

router.get('/', (req, res) => {
  res.json([{ id: '1', name: '2026-2027' }]);
});

export default router;