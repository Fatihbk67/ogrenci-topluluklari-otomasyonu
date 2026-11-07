const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const ogrenciController = require('../controllers/ogrenciController');

router.use(verifyToken, checkRole('ogrenci'));

router.get('/topluluklar', ogrenciController.getTopluluklar);
router.post('/topluluklar/:id/basvuru', ogrenciController.basvuruYap);
router.delete('/topluluklar/:id/basvuru', ogrenciController.basvuruIptal);

module.exports = router;