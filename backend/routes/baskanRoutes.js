const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const { toplulukGorselYukle } = require('../middleware/upload');
const baskanController = require('../controllers/baskanController');

router.use(verifyToken, checkRole('baskan'));

router.get('/istatistikler', baskanController.getIstatistikler);

router.get('/topluluk-profili', baskanController.getTopluluqProfili);
router.put('/topluluk-profili', baskanController.topluluqProfiliGuncelle);
router.post('/topluluk-profili/gorsel', toplulukGorselYukle.single('gorsel'), baskanController.topluluqGorselYukle);

router.get('/uyeler', baskanController.getUyeler);
router.patch('/uyeler/:id/durum', baskanController.uyelikDurumGuncelle);

router.get('/etkinlikler', baskanController.getEtkinlikler);
router.post('/etkinlikler', baskanController.etkinlikOlustur);
router.put('/etkinlikler/:id', baskanController.etkinlikGuncelle);
router.delete('/etkinlikler/:id', baskanController.etkinlikSil);

module.exports = router;