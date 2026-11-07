const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Bu router'daki TÜM rotalar önce token doğrulaması, sonra admin rol kontrolünden geçer.
router.use(verifyToken, checkRole('admin'));

// Dashboard
router.get('/istatistikler', adminController.getIstatistikler);

// Log kaydı (denetim günlüğü)
router.get('/log-kayitlari', adminController.getLogKayitlari);

// Kullanıcı yönetimi
router.get('/kullanicilar', adminController.getKullanicilar);
router.get('/kullanicilar/secenekler', adminController.getKullaniciSecenekleri);
router.get('/kullanicilar/:id', adminController.getKullanici);
router.post('/kullanicilar', adminController.kullaniciOlustur);
router.put('/kullanicilar/:id', adminController.kullaniciGuncelle);
router.delete('/kullanicilar/:id', adminController.kullaniciSil);

// Topluluk yönetimi
router.get('/topluluklar', adminController.getTopluluklar);
router.post('/topluluklar', adminController.topluluklarOlustur);
router.put('/topluluklar/:id', adminController.topluluklarGuncelle);
router.patch('/topluluklar/:id/durum', adminController.topluluklarDurumGuncelle);
router.delete('/topluluklar/:id', adminController.topluluklarSil);

// Etkinlik yönetimi
router.get('/etkinlikler', adminController.getEtkinlikler);
router.get('/etkinlikler/topluluk-secenekleri', adminController.getTopluluqSecenekleri);
router.post('/etkinlikler', adminController.etkinlikOlustur);
router.put('/etkinlikler/:id', adminController.etkinlikGuncelle);
router.patch('/etkinlikler/:id/durum', adminController.etkinlikDurumGuncelle);
router.delete('/etkinlikler/:id', adminController.etkinlikSil);

module.exports = router;