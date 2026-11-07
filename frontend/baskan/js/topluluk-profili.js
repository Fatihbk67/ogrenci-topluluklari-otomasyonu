let SECILEN_DOSYA = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('topluluk-profili');
  await profiliYukle();

  document.getElementById('gorselSecBtn').addEventListener('click', () => {
    document.getElementById('gorselInput').click();
  });
  document.getElementById('gorselInput').addEventListener('change', gorselSecildi);
  document.getElementById('gorselYukleBtn').addEventListener('click', gorselYukle);
  document.getElementById('profilForm').addEventListener('submit', profilKaydet);
});

async function profiliYukle() {
  try {
    const yanit = await apiIstek('/baskan/topluluk-profili');
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Topluluk bilgileri alınamadı.', 'hata');
      return;
    }

    const t = veri.topluluk;
    document.getElementById('sayfaBaslik').textContent = `Topluluk Profilim — ${t.ad}`;
    document.getElementById('aciklama').value = t.aciklama || '';
    document.getElementById('detayBilgi').value = t.detay_bilgi || '';
    document.getElementById('iletisimBilgisi').value = t.iletisim_bilgisi || '';
    document.getElementById('sosyalMedya').value = t.sosyal_medya || '';

    gorselOnizlemeGoster(t.kapak_gorseli);
  } catch (err) {
    console.error(err);
  }
}

function gorselOnizlemeGoster(yol) {
  const kutu = document.getElementById('gorselOnizleme');
  if (yol) {
    kutu.innerHTML = `<img src="${yol}" alt="Topluluk görseli">`;
  } else {
    kutu.innerHTML = 'Görsel yok';
  }
}

function gorselSecildi(e) {
  const dosya = e.target.files[0];
  if (!dosya) return;

  if (dosya.size > 5 * 1024 * 1024) {
    bildirimGoster('Görsel 5MB\'dan büyük olamaz.', 'hata');
    e.target.value = '';
    return;
  }

  SECILEN_DOSYA = dosya;
  const okuyucu = new FileReader();
  okuyucu.onload = (ev) => {
    document.getElementById('gorselOnizleme').innerHTML = `<img src="${ev.target.result}" alt="Önizleme">`;
  };
  okuyucu.readAsDataURL(dosya);

  document.getElementById('gorselYukleBtn').style.display = 'block';
}

async function gorselYukle() {
  if (!SECILEN_DOSYA) return;

  const btn = document.getElementById('gorselYukleBtn');
  btn.disabled = true;
  btn.textContent = 'Yükleniyor...';

  try {
    const formVerisi = new FormData();
    formVerisi.append('gorsel', SECILEN_DOSYA);

    const token = localStorage.getItem('token');
    const yanit = await fetch('/api/baskan/topluluk-profili/gorsel', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formVerisi
    });
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Görsel yüklenemedi.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    gorselOnizlemeGoster(veri.kapak_gorseli);
    SECILEN_DOSYA = null;
    btn.style.display = 'none';
  } catch (err) {
    console.error(err);
    bildirimGoster('Görsel yüklenirken bir hata oluştu.', 'hata');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Görseli Yükle';
  }
}

async function profilKaydet(e) {
  e.preventDefault();

  const gövde = {
    aciklama: document.getElementById('aciklama').value.trim(),
    detay_bilgi: document.getElementById('detayBilgi').value.trim(),
    iletisim_bilgisi: document.getElementById('iletisimBilgisi').value.trim(),
    sosyal_medya: document.getElementById('sosyalMedya').value.trim()
  };

  const kaydetBtn = document.getElementById('kaydetBtn');
  kaydetBtn.disabled = true;
  kaydetBtn.textContent = 'Kaydediliyor...';

  try {
    const yanit = await apiIstek('/baskan/topluluk-profili', {
      method: 'PUT',
      body: JSON.stringify(gövde)
    });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Kaydedilemedi.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
  } catch (err) {
    console.error(err);
  } finally {
    kaydetBtn.disabled = false;
    kaydetBtn.textContent = 'Kaydet';
  }
}
