const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL bağlantı havuzu (connection pool) oluşturuyoruz.
// Havuz kullanmak, her istekte yeni bağlantı açıp kapatmaktan çok daha performanslıdır.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ogrenci_toplulugu_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Uygulama ayağa kalkarken bağlantıyı test edelim
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL veritabanına başarıyla bağlanıldı.');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL bağlantı hatası:', err.message);
  }
})();

module.exports = pool;