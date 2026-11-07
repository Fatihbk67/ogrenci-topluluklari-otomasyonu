// ============================================================
// Tüm admin sayfalarında ortak kullanılan yardımcı fonksiyonlar
// ============================================================
const API_TABAN = '/api';

/**
 * Sayfa yüklenir yüklenmez oturumu kontrol eder.
 * Token yoksa veya rol admin değilse login sayfasına atar.
 */
function oturumDogrula() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token || rol !== 'admin') {
    window.location.href = '../login.html';
    return null;
  }

  const adSoyad = localStorage.getItem('kullaniciAdi') || 'Yönetici';
  const adSoyadEl = document.getElementById('kcKullaniciAdi');
  if (adSoyadEl) adSoyadEl.textContent = adSoyad;

  kimlikBariniDoldur(adSoyad, 'admin', 'Yönetici Paneli');

  return token;
}

/**
 * Sayfanın üstündeki kişiye özel kimlik çubuğunu doldurur:
 * baş harfler (avatar), ad soyad ve rol etiketi.
 */
function kimlikBariniDoldur(adSoyad, rol, rolEtiket) {
  const adEl = document.getElementById('kimlikAd');
  const rolEl = document.getElementById('kimlikRol');
  const avatarEl = document.getElementById('kimlikAvatar');
  if (!adEl && !rolEl && !avatarEl) return;

  if (adEl) adEl.textContent = adSoyad;
  if (rolEl) rolEl.textContent = rolEtiket;
  if (avatarEl) {
    const parcalar = adSoyad.trim().split(/\s+/);
    const bas1 = parcalar[0] ? parcalar[0][0] : '';
    const bas2 = parcalar.length > 1 ? parcalar[parcalar.length - 1][0] : '';
    avatarEl.textContent = (bas1 + bas2).toLocaleUpperCase('tr-TR');
  }
}

/** Çıkış yap */
function cikisYap() {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  localStorage.removeItem('kullaniciAdi');
  localStorage.removeItem('kullaniciId');
  window.location.href = '../login.html';
}

/**
 * Yetkili (Authorization header'lı) fetch isteği atar.
 * 401/403 durumunda otomatik olarak login sayfasına yönlendirir.
 */
async function apiIstek(yol, secenekler = {}) {
  const token = localStorage.getItem('token');

  const yanit = await fetch(`${API_TABAN}${yol}`, {
    ...secenekler,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(secenekler.headers || {})
    }
  });

  if (yanit.status === 401 || yanit.status === 403) {
    const veri = await yanit.json().catch(() => ({}));
    if (yanit.status === 401) {
      cikisYap();
      return;
    }
    bildirimGoster(veri.mesaj || 'Bu işlem için yetkiniz yok.', 'hata');
    throw new Error(veri.mesaj || 'Yetkisiz işlem');
  }

  return yanit;
}

/** Ekranın sağ üstünde kısa süreli bildirim gösterir */
function bildirimGoster(mesaj, tur = 'normal') {
  let kutu = document.getElementById('genelBildirim');
  if (!kutu) {
    kutu = document.createElement('div');
    kutu.id = 'genelBildirim';
    kutu.className = 'bildirim';
    document.body.appendChild(kutu);
  }
  kutu.textContent = mesaj;
  kutu.className = `bildirim goster ${tur === 'hata' ? 'hata' : tur === 'basarili' ? 'basarili' : ''}`;

  clearTimeout(kutu._zamanlayici);
  kutu._zamanlayici = setTimeout(() => {
    kutu.classList.remove('goster');
  }, 3200);
}

/** Tarihi gün.ay.yıl formatına çevirir */
function tarihFormatla(isoTarih) {
  if (!isoTarih) return '-';
  const d = new Date(isoTarih);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Aktif menü linkini işaretler (data-sayfa attribute'una göre) */
function aktifMenuIsaretle(sayfaAdi) {
  document.querySelectorAll('.kc-menu a').forEach(a => {
    if (a.dataset.sayfa === sayfaAdi) a.classList.add('aktif');
  });
}

/**
 * Kenar çubuğunu daraltır/genişletir ve tercihi tarayıcıda saklar,
 * böylece sayfalar arası geçişte durum korunur.
 */
function sideberDurumunuUygula() {
  const kenarCubugu = document.querySelector('.kenar-cubugu');
  if (!kenarCubugu) return;
  const daraltilmisMi = localStorage.getItem('sidebarDaraltilmis') === '1';
  kenarCubugu.classList.toggle('daraltilmis', daraltilmisMi);
}

function sidebarDarat() {
  const kenarCubugu = document.querySelector('.kenar-cubugu');
  if (!kenarCubugu) return;
  const yeniDurum = !kenarCubugu.classList.contains('daraltilmis');
  kenarCubugu.classList.toggle('daraltilmis', yeniDurum);
  localStorage.setItem('sidebarDaraltilmis', yeniDurum ? '1' : '0');
}

// Sayfa yüklenirken: kayıtlı sidebar tercihini uygula, çıkış ve daraltma butonlarını bağla
document.addEventListener('DOMContentLoaded', () => {
  sideberDurumunuUygula();

  const cikisBtn = document.getElementById('kcCikisBtn');
  if (cikisBtn) cikisBtn.addEventListener('click', cikisYap);

  const daraltBtn = document.getElementById('kcDaraltBtn');
  if (daraltBtn) daraltBtn.addEventListener('click', sidebarDarat);
});