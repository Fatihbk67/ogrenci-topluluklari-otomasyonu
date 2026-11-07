const API_TABAN = '/api';

/* ============ Zaten giriş yapılmışsa yönlendir ============ */
(function oturumKontrol() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');
  if (token && rol) {
    yonlendir(rol);
  }
})();

/* ============ SEKME GEÇİŞİ ============ */
const girisSekmeBtn = document.getElementById('girisSekmeBtn');
const kayitSekmeBtn = document.getElementById('kayitSekmeBtn');
const girisPaneli = document.getElementById('girisPaneli');
const kayitPaneli = document.getElementById('kayitPaneli');
const sifirlamaPaneli = document.getElementById('sifirlamaPaneli');
const sekmeSatiri = document.querySelector('.sekme-satiri');

function girisSekmesineGec() {
  girisSekmeBtn.classList.add('aktif');
  kayitSekmeBtn.classList.remove('aktif');
  girisSekmeBtn.setAttribute('aria-selected', 'true');
  kayitSekmeBtn.setAttribute('aria-selected', 'false');
  girisPaneli.hidden = false;
  kayitPaneli.hidden = true;
  sifirlamaPaneli.hidden = true;
  sekmeSatiri.hidden = false;
}

function kayitSekmesineGec() {
  kayitSekmeBtn.classList.add('aktif');
  girisSekmeBtn.classList.remove('aktif');
  kayitSekmeBtn.setAttribute('aria-selected', 'true');
  girisSekmeBtn.setAttribute('aria-selected', 'false');
  kayitPaneli.hidden = false;
  girisPaneli.hidden = true;
  sifirlamaPaneli.hidden = true;
  sekmeSatiri.hidden = false;
}

function sifirlamaSekmesineGec() {
  sifirlamaPaneli.hidden = false;
  girisPaneli.hidden = true;
  kayitPaneli.hidden = true;
  sekmeSatiri.hidden = true; // "Giriş Yap / Hesap Oluştur" sekmeleri bu akışta gizlenir
  sifirlamaAdim1eGec();
}

girisSekmeBtn.addEventListener('click', girisSekmesineGec);
kayitSekmeBtn.addEventListener('click', kayitSekmesineGec);
document.getElementById('kayitaGecBtn').addEventListener('click', (e) => { e.preventDefault(); kayitSekmesineGec(); });
document.getElementById('girisaGecBtn').addEventListener('click', (e) => { e.preventDefault(); girisSekmesineGec(); });
document.getElementById('sifremiUnuttumBtn').addEventListener('click', sifirlamaSekmesineGec);

/* ============ Şifre göster/gizle (her iki form için de) ============ */
document.querySelectorAll('.sifre-goster').forEach(btn => {
  btn.addEventListener('click', () => {
    const hedef = document.getElementById(btn.dataset.hedef);
    const tipGoster = hedef.type === 'password';
    hedef.type = tipGoster ? 'text' : 'password';
    btn.textContent = tipGoster ? 'Gizle' : 'Göster';
  });
});

/* ============ GİRİŞ FORMU ============ */
const girisFormu = document.getElementById('girisFormu');
const girisHata = document.getElementById('girisHata');
const girisBtn = document.getElementById('girisBtn');
const girisBtnMetin = document.getElementById('girisBtnMetin');

girisFormu.addEventListener('submit', async (e) => {
  e.preventDefault();
  hataGizle(girisHata);

  const email = document.getElementById('girisEmail').value.trim();
  const sifre = document.getElementById('girisSifre').value;

  if (!email || !sifre) {
    hataGoster(girisHata, 'Lütfen e-posta ve şifrenizi giriniz.');
    return;
  }

  girisBtn.disabled = true;
  girisBtnMetin.textContent = 'Giriş yapılıyor...';

  try {
    const yanit = await fetch(`${API_TABAN}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, sifre })
    });

    const veri = await yanit.json();

    if (!yanit.ok || !veri.basarili) {
      hataGoster(girisHata, veri.mesaj || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      girisBtn.disabled = false;
      girisBtnMetin.textContent = 'Giriş Yap';
      return;
    }

    oturumuKaydet(veri.token, veri.kullanici);
    yonlendir(veri.kullanici.rol);

  } catch (err) {
    console.error(err);
    hataGoster(girisHata, 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    girisBtn.disabled = false;
    girisBtnMetin.textContent = 'Giriş Yap';
  }
});

/* ============ KAYIT FORMU ============ */
const kayitFormu = document.getElementById('kayitFormu');
const kayitHata = document.getElementById('kayitHata');
const kayitBtn = document.getElementById('kayitBtn');
const kayitBtnMetin = document.getElementById('kayitBtnMetin');

kayitFormu.addEventListener('submit', async (e) => {
  e.preventDefault();
  hataGizle(kayitHata);

  const ad = document.getElementById('kayitAd').value.trim();
  const soyad = document.getElementById('kayitSoyad').value.trim();
  const email = document.getElementById('kayitEmail').value.trim();
  const ogrenci_no = document.getElementById('kayitOgrenciNo').value.trim();
  const bolum = document.getElementById('kayitBolum').value.trim();
  const sifre = document.getElementById('kayitSifre').value;
  const sifreTekrar = document.getElementById('kayitSifreTekrar').value;

  if (!ad || !soyad || !email || !sifre || !sifreTekrar) {
    hataGoster(kayitHata, 'Lütfen zorunlu alanları doldurun.');
    return;
  }
  if (sifre.length < 6) {
    hataGoster(kayitHata, 'Şifre en az 6 karakter olmalıdır.');
    return;
  }
  if (sifre !== sifreTekrar) {
    hataGoster(kayitHata, 'Şifreler birbiriyle eşleşmiyor.');
    return;
  }

  kayitBtn.disabled = true;
  kayitBtnMetin.textContent = 'Hesap oluşturuluyor...';

  try {
    const yanit = await fetch(`${API_TABAN}/auth/kayit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad, soyad, email, sifre, ogrenci_no, bolum })
    });

    const veri = await yanit.json();

    if (!yanit.ok || !veri.basarili) {
      hataGoster(kayitHata, veri.mesaj || 'Kayıt oluşturulamadı.');
      kayitBtn.disabled = false;
      kayitBtnMetin.textContent = 'Hesap Oluştur';
      return;
    }

    oturumuKaydet(veri.token, veri.kullanici);
    yonlendir(veri.kullanici.rol);

  } catch (err) {
    console.error(err);
    hataGoster(kayitHata, 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    kayitBtn.disabled = false;
    kayitBtnMetin.textContent = 'Hesap Oluştur';
  }
});

/* ============ ŞİFREMİ UNUTTUM (3 ADIM) ============ */
let SIFIRLAMA_EMAIL = '';
let SIFIRLAMA_TOKEN = '';

function adimNoktalariniGuncelle(aktifAdim) {
  for (let i = 1; i <= 3; i++) {
    const nokta = document.getElementById(`nokta${i}`);
    nokta.classList.remove('aktif', 'tamam');
    if (i < aktifAdim) nokta.classList.add('tamam');
    else if (i === aktifAdim) nokta.classList.add('aktif');
  }
}

function sifirlamaAdim1eGec() {
  document.getElementById('sifirlamaAdim1').hidden = false;
  document.getElementById('sifirlamaAdim2').hidden = true;
  document.getElementById('sifirlamaAdim3').hidden = true;
  adimNoktalariniGuncelle(1);
}

function sifirlamaAdim2yeGec() {
  document.getElementById('sifirlamaAdim1').hidden = true;
  document.getElementById('sifirlamaAdim2').hidden = false;
  document.getElementById('sifirlamaAdim3').hidden = true;
  adimNoktalariniGuncelle(2);
  document.getElementById('adim2AltBaslik').textContent = `${SIFIRLAMA_EMAIL} adresine gönderilen 6 haneli kodu girin.`;
  document.getElementById('sifirlamaKod').value = '';
  document.getElementById('sifirlamaKod').focus();
}

function sifirlamaAdim3eGec() {
  document.getElementById('sifirlamaAdim1').hidden = true;
  document.getElementById('sifirlamaAdim2').hidden = true;
  document.getElementById('sifirlamaAdim3').hidden = false;
  adimNoktalariniGuncelle(3);
}

document.getElementById('adim1GeriBtn').addEventListener('click', girisSekmesineGec);
document.getElementById('adim2GeriBtn').addEventListener('click', sifirlamaAdim1eGec);

/* ---- Adım 1: E-posta gönder ---- */
const adim1Formu = document.getElementById('adim1Formu');
const adim1Hata = document.getElementById('adim1Hata');
const adim1Btn = document.getElementById('adim1Btn');
const adim1BtnMetin = document.getElementById('adim1BtnMetin');

async function kodGonderIstegi() {
  const email = document.getElementById('sifirlamaEmail').value.trim();
  if (!email) {
    hataGoster(adim1Hata, 'Lütfen e-posta adresinizi giriniz.');
    return;
  }

  hataGizle(adim1Hata);
  adim1Btn.disabled = true;
  adim1BtnMetin.textContent = 'Gönderiliyor...';

  try {
    const yanit = await fetch(`${API_TABAN}/auth/sifremi-unuttum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const veri = await yanit.json();

    if (!yanit.ok || !veri.basarili) {
      hataGoster(adim1Hata, veri.mesaj || 'Kod gönderilemedi.');
      return;
    }

    SIFIRLAMA_EMAIL = email;

    // Sunucu SMTP yapılandırılmadığı için "test modunda" çalışıyorsa,
    // kodu doğrudan ekranda gösteriyoruz (gerçek ortamda bu alan boş gelir).
    const testKutusu = document.getElementById('adim2TestModu');
    if (veri.testKodu) {
      testKutusu.innerHTML = `Sunucu e-posta gönderimi için henüz yapılandırılmamış (test modu).<br>Doğrulama kodunuz: <strong>${veri.testKodu}</strong>`;
      testKutusu.hidden = false;
    } else {
      testKutusu.hidden = true;
    }

    sifirlamaAdim2yeGec();

  } catch (err) {
    console.error(err);
    hataGoster(adim1Hata, 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
  } finally {
    adim1Btn.disabled = false;
    adim1BtnMetin.textContent = 'Doğrulama Kodu Gönder';
  }
}

adim1Formu.addEventListener('submit', (e) => { e.preventDefault(); kodGonderIstegi(); });

/* ---- Adım 2: Kodu doğrula ---- */
const adim2Formu = document.getElementById('adim2Formu');
const adim2Hata = document.getElementById('adim2Hata');
const adim2Btn = document.getElementById('adim2Btn');
const adim2BtnMetin = document.getElementById('adim2BtnMetin');

adim2Formu.addEventListener('submit', async (e) => {
  e.preventDefault();
  hataGizle(adim2Hata);

  const kod = document.getElementById('sifirlamaKod').value.trim();
  if (kod.length !== 6) {
    hataGoster(adim2Hata, 'Lütfen 6 haneli kodu eksiksiz giriniz.');
    return;
  }

  adim2Btn.disabled = true;
  adim2BtnMetin.textContent = 'Doğrulanıyor...';

  try {
    const yanit = await fetch(`${API_TABAN}/auth/kod-dogrula`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SIFIRLAMA_EMAIL, kod })
    });
    const veri = await yanit.json();

    if (!yanit.ok || !veri.basarili) {
      hataGoster(adim2Hata, veri.mesaj || 'Kod doğrulanamadı.');
      return;
    }

    SIFIRLAMA_TOKEN = veri.sifirlamaToken;
    sifirlamaAdim3eGec();

  } catch (err) {
    console.error(err);
    hataGoster(adim2Hata, 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
  } finally {
    adim2Btn.disabled = false;
    adim2BtnMetin.textContent = 'Kodu Doğrula';
  }
});

document.getElementById('kodTekrarGonderBtn').addEventListener('click', (e) => {
  e.preventDefault();
  kodGonderIstegi();
});

/* ---- Adım 3: Yeni şifre belirle ---- */
const adim3Formu = document.getElementById('adim3Formu');
const adim3Hata = document.getElementById('adim3Hata');
const adim3Basari = document.getElementById('adim3Basari');
const adim3Btn = document.getElementById('adim3Btn');
const adim3BtnMetin = document.getElementById('adim3BtnMetin');

adim3Formu.addEventListener('submit', async (e) => {
  e.preventDefault();
  hataGizle(adim3Hata);
  adim3Basari.hidden = true;

  const yeniSifre = document.getElementById('yeniSifre').value;
  const yeniSifreTekrar = document.getElementById('yeniSifreTekrar').value;

  if (yeniSifre.length < 6) {
    hataGoster(adim3Hata, 'Şifre en az 6 karakter olmalıdır.');
    return;
  }
  if (yeniSifre !== yeniSifreTekrar) {
    hataGoster(adim3Hata, 'Şifreler birbiriyle eşleşmiyor.');
    return;
  }

  adim3Btn.disabled = true;
  adim3BtnMetin.textContent = 'Güncelleniyor...';

  try {
    const yanit = await fetch(`${API_TABAN}/auth/sifre-sifirla`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sifirlamaToken: SIFIRLAMA_TOKEN, yeniSifre })
    });
    const veri = await yanit.json();

    if (!yanit.ok || !veri.basarili) {
      hataGoster(adim3Hata, veri.mesaj || 'Şifre güncellenemedi.');
      adim3Btn.disabled = false;
      adim3BtnMetin.textContent = 'Şifreyi Güncelle';
      return;
    }

    adim3Basari.textContent = veri.mesaj || 'Şifreniz güncellendi. Giriş ekranına yönlendiriliyorsunuz...';
    adim3Basari.hidden = false;
    adim3Formu.querySelectorAll('input, button').forEach(el => el.disabled = true);

    setTimeout(() => {
      SIFIRLAMA_EMAIL = '';
      SIFIRLAMA_TOKEN = '';
      adim3Formu.reset();
      adim3Formu.querySelectorAll('input, button').forEach(el => el.disabled = false);
      adim3BtnMetin.textContent = 'Şifreyi Güncelle';
      adim3Basari.hidden = true;
      document.getElementById('girisEmail').value = '';
      girisSekmesineGec();
    }, 2200);

  } catch (err) {
    console.error(err);
    hataGoster(adim3Hata, 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.');
    adim3Btn.disabled = false;
    adim3BtnMetin.textContent = 'Şifreyi Güncelle';
  }
});

/* ============ Ortak yardımcılar ============ */
function oturumuKaydet(token, kullanici) {
  localStorage.setItem('token', token);
  localStorage.setItem('rol', kullanici.rol);
  localStorage.setItem('kullaniciAdi', `${kullanici.ad} ${kullanici.soyad}`);
  localStorage.setItem('kullaniciId', kullanici.id);
}

function yonlendir(rol) {
  const rotalar = {
    admin: 'admin/dashboard.html',
    danisman: 'danisman/dashboard.html',
    baskan: 'baskan/dashboard.html',
    ogrenci: 'ogrenci/dashboard.html'
  };
  window.location.href = rotalar[rol] || 'login.html';
}

function hataGoster(kutu, mesaj) {
  kutu.textContent = mesaj;
  kutu.hidden = false;
}

function hataGizle(kutu) {
  kutu.hidden = true;
  kutu.textContent = '';
}