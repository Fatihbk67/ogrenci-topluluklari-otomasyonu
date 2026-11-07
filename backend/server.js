const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const baskanRoutes = require('./routes/baskanRoutes');
const ogrenciRoutes = require('./routes/ogrenciRoutes');
const logKaydiMiddleware = require('./middleware/logKaydi');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tüm /api/* isteklerini (kim, ne zaman, hangi IP/tarayıcı, ne kadar sürede) kaydeder.
app.use('/api', logKaydiMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/baskan', baskanRoutes);
app.use('/api/ogrenci', ogrenciRoutes);

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ basarili: false, mesaj: 'İstenen API adresi bulunamadı.' });
});

app.use((err, req, res, next) => {
  console.error('Beklenmeyen hata:', err);
  if (err && (err.name === 'MulterError' || /görsel/i.test(err.message || ''))) {
    return res.status(400).json({ basarili: false, mesaj: err.message || 'Görsel yüklenirken hata oluştu.' });
  }
  res.status(500).json({ basarili: false, mesaj: 'Sunucuda beklenmeyen bir hata oluştu.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});