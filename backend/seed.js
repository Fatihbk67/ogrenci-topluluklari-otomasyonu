/**
 * Bu script veritabanına varsayılan bir ADMIN kullanıcısı ekler.
 * Çalıştırmak için: npm run seed
 */
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const ADMIN_EMAIL = 'admin@mtu.edu.tr';
const ADMIN_SIFRE = 'Admin123!';

(async () => {
  try {
    const [mevcut] = await pool.query('SELECT id FROM kullanicilar WHERE email = ?', [ADMIN_EMAIL]);

    if (mevcut.length > 0) {
      console.log('ℹ️  Admin kullanıcı zaten mevcut, işlem atlandı.');
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_SIFRE, 10);

    await pool.query(
      `INSERT INTO kullanicilar (ad, soyad, email, sifre, rol) VALUES (?, ?, ?, ?, 'admin')`,
      ['Sistem', 'Yöneticisi', ADMIN_EMAIL, hash]
    );

    console.log('✅ Varsayılan admin kullanıcısı oluşturuldu:');
    console.log(`   E-posta: ${ADMIN_EMAIL}`);
    console.log(`   Şifre  : ${ADMIN_SIFRE}`);
    console.log('   Giriş yaptıktan sonra şifreyi değiştirmeniz önerilir.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed hatası:', err);
    process.exit(1);
  }
})();