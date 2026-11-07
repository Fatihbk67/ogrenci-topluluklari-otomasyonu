const API_TABAN = '/api';

function oturumDogrula() {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token || rol !== 'ogrenci') {
    window.location.href = '../login.html';
    return null;
  }

  const adSoyad = localStorage.getItem('kullaniciAdi') || 'Öğrenci';
  const adSoyadEl = document.getElementById('kcKullaniciAdi');
  if (adSoyadEl) adSoyadEl.textContent = adSoyad;

  return token;
}

function cikisYap() {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  localStorage.removeItem('kullaniciAdi');
  localStorage.removeItem('kullaniciId');
  window.location.href = '../login.html';
}

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

function aktifMenuIsaretle(sayfaAdi) {
  document.querySelectorAll('.kc-menu a').forEach(a => {
    if (a.dataset.sayfa === sayfaAdi) a.classList.add('aktif');
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
  sideberDurumunuUygula();

  const cikisBtn = document.getElementById('kcCikisBtn');
  if (cikisBtn) cikisBtn.addEventListener('click', cikisYap);

  const daraltBtn = document.getElementById('kcDaraltBtn');
  if (daraltBtn) daraltBtn.addEventListener('click', sidebarDarat);
});