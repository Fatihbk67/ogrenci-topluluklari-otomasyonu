const nodemailer = require('nodemailer');

/**
 * SMTP bilgileri .env dosyasından okunur. Gmail kullanıyorsanız:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false
 *   SMTP_USER=hesabiniz@gmail.com
 *   SMTP_PASS=uygulama_sifresi   (normal Gmail şifresi DEĞİL, "Uygulama Şifresi")
 *   SMTP_FROM="Öğrenci Toplulukları Otomasyonu <hesabiniz@gmail.com>"
 */
function transporterOlustur() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // SMTP bilgileri girilmemiş, test modunda çalışılacak
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const transporter = transporterOlustur();

/**
 * Şifre sıfırlama doğrulama kodunu e-posta ile gönderir.
 * SMTP yapılandırılmamışsa (geliştirme ortamı), kodu terminale yazdırır —
 * böylece gerçek bir e-posta hesabı olmadan da sistem test edilebilir.
 */
async function dogrulamaKoduGonder({ aliciEmail, aliciAd, kod }) {
  if (!transporter) {
    console.log('\n📧 [E-POSTA TEST MODU — SMTP yapılandırılmamış]');
    console.log(`   Alıcı : ${aliciEmail}`);
    console.log(`   Kod   : ${kod}  (10 dakika geçerli)\n`);
    return { gonderildi: false, testModu: true };
  }

  const gonderenAdresi = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: gonderenAdresi,
    to: aliciEmail,
    subject: 'Şifre Sıfırlama Doğrulama Kodu — Öğrenci Toplulukları Otomasyonu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #E2E5EA; border-radius: 10px;">
        <p style="color:#6B7280; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px;">Malatya Turgut Özal Üniversitesi</p>
        <h2 style="color:#1B2A4A; margin:0 0 18px;">Şifre Sıfırlama Talebi</h2>
        <p style="color:#1F2430; font-size:14px; line-height:1.6;">
          Merhaba ${aliciAd || ''},<br><br>
          Öğrenci Toplulukları Otomasyon Sistemi hesabınız için bir şifre sıfırlama talebinde bulunuldu.
          Aşağıdaki doğrulama kodunu ilgili ekrana girerek işlemi tamamlayabilirsiniz.
        </p>
        <div style="background:#F5F6F8; border-radius:8px; padding:16px; text-align:center; margin:20px 0;">
          <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:#1B2A4A;">${kod}</span>
        </div>
        <p style="color:#6B7280; font-size:12.5px; line-height:1.6;">
          Bu kod 10 dakika süreyle geçerlidir. Bu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.
        </p>
      </div>
    `
  });

  return { gonderildi: true, testModu: false };
}

module.exports = { dogrulamaKoduGonder };
