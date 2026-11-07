const express = require('express');
const router = express.Router();
const { login, ben, kayitOl, sifremiUnuttum, kodDogrula, sifreSifirla } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.post('/kayit', kayitOl);
router.get('/ben', verifyToken, ben);

router.post('/sifremi-unuttum', sifremiUnuttum);
router.post('/kod-dogrula', kodDogrula);
router.post('/sifre-sifirla', sifreSifirla);

module.exports = router;