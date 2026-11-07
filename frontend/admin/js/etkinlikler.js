let TUM_ETKINLIKLER = [];

const E_DURUM_ETIKET = { onaylandi: 'Onaylandı', beklemede: 'Beklemede', reddedildi: 'Reddedildi', tamamlandi: 'Tamamlandı', iptal: 'İptal Edildi' };
const E_DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', tamamlandi: 'd-tamamlandi', iptal: 'd-iptal' };

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('etkinlikler');
  await topluluqFiltreDoldur();
  await etkinlikleriYukle();

  document.getElementById('yeniEtkinlikBtn').addEventListener('click', () => modalAc());
  document.getElementById('modalKapatBtn').addEventListener('click', modalKapat);
  document.getElementById('modalIptalBtn').addEventListener('click', modalKapat);
  document.getElementById('etkinlikForm').addEventListener('submit', formGonder);

  document.getElementById('durumFiltre').addEventListener('change', etkinlikleriYukle);
  document.getElementById('topluluqFiltre').addEventListener('change', etkinlikleriYukle);
});

/* ---------------- Listeleme ---------------- */
async function etkinlikleriYukle() {
  const durum = document.getElementById('durumFiltre').value;
  const topluluk_id = document.getElementById('topluluqFiltre').value;

  const parametreler = new URLSearchParams();
  if (durum) parametreler.set('durum', durum);
  if (topluluk_id) parametreler.set('topluluk_id', topluluk_id);

  try {
    const yanit = await apiIstek(`/admin/etkinlikler?${parametreler.toString()}`);
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster('Etkinlikler alınamadı.', 'hata');
      return;
    }

    TUM_ETKINLIKLER = veri.etkinlikler;
    tabloyuCiz(TUM_ETKINLIKLER);
  } catch (err) {
    console.error(err);
  }
}

function tabloyuCiz(liste) {
  const govde = document.getElementById('etkinliklerGovde');

  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="6">Kayıt bulunamadı.</td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(e => `
    <tr>
      <td>${e.baslik}</td>
      <td>${e.topluluk_ad}</td>
      <td>${tarihSaatFormatla(e.tarih)}</td>
      <td>${e.konum || '-'}</td>
      <td><span class="rozet-etiket ${E_DURUM_SINIF[e.durum]}">${E_DURUM_ETIKET[e.durum]}</span></td>
      <td>
        <div class="eylem-grubu">
          ${e.durum === 'beklemede' ? `
            <button class="btn btn-basari btn-kucuk" onclick="durumGuncelle(${e.id}, 'onaylandi')">Onayla</button>
            <button class="btn btn-tehlike btn-kucuk" onclick="durumGuncelle(${e.id}, 'reddedildi')">Reddet</button>
          ` : ''}
          ${e.durum === 'onaylandi' ? `
            <button class="btn btn-ikincil btn-kucuk" onclick="durumGuncelle(${e.id}, 'tamamlandi')">Tamamlandı</button>
            <button class="btn btn-tehlike btn-kucuk" onclick="durumGuncelle(${e.id}, 'iptal')">İptal Et</button>
          ` : ''}
          <button class="btn btn-ikincil btn-kucuk" onclick="modalAc(${e.id})">Düzenle</button>
          <button class="btn btn-tehlike btn-kucuk" onclick="etkinlikSilOnay(${e.id})">Sil</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ---------------- Filtre için topluluk listesi ---------------- */
async function topluluqFiltreDoldur() {
  try {
    const yanit = await apiIstek('/admin/etkinlikler/topluluk-secenekleri');
    if (!yanit) return;
    const veri = await yanit.json();
    if (!veri.basarili) return;

    const filtreSelect = document.getElementById('topluluqFiltre');
    const modalSelect = document.getElementById('topluluqSecim');

    veri.topluluklar.forEach(t => {
      filtreSelect.innerHTML += `<option value="${t.id}">${t.ad}</option>`;
      modalSelect.innerHTML += `<option value="${t.id}">${t.ad}</option>`;
    });
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Modal ---------------- */
function modalAc(id = null) {
  const form = document.getElementById('etkinlikForm');
  form.reset();
  document.getElementById('etkinlikId').value = '';

  if (id) {
    const etkinlik = TUM_ETKINLIKLER.find(e => e.id === id);
    if (!etkinlik) return;

    document.getElementById('modalBaslik').textContent = 'Etkinliği Düzenle';
    document.getElementById('etkinlikId').value = etkinlik.id;
    document.getElementById('topluluqSecim').value = etkinlik.topluluk_id;
    document.getElementById('baslik').value = etkinlik.baslik;
    document.getElementById('aciklama').value = etkinlik.aciklama || '';
    document.getElementById('tarih').value = isoToDatetimeLocal(etkinlik.tarih);
    document.getElementById('konum').value = etkinlik.konum || '';
  } else {
    document.getElementById('modalBaslik').textContent = 'Yeni Etkinlik';
  }

  document.getElementById('etkinlikModal').classList.add('acik');
}

function modalKapat() {
  document.getElementById('etkinlikModal').classList.remove('acik');
}

/* ---------------- Form gönder ---------------- */
async function formGonder(e) {
  e.preventDefault();

  const id = document.getElementById('etkinlikId').value;
  const gövde = {
    topluluk_id: document.getElementById('topluluqSecim').value,
    baslik: document.getElementById('baslik').value.trim(),
    aciklama: document.getElementById('aciklama').value.trim(),
    tarih: document.getElementById('tarih').value,
    konum: document.getElementById('konum').value.trim()
  };

  if (!gövde.topluluk_id) {
    bildirimGoster('Lütfen bir topluluk seçin.', 'hata');
    return;
  }

  const kaydetBtn = document.getElementById('kaydetBtn');
  kaydetBtn.disabled = true;
  kaydetBtn.textContent = 'Kaydediliyor...';

  try {
    const yanit = await apiIstek(id ? `/admin/etkinlikler/${id}` : '/admin/etkinlikler', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(gövde)
    });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'İşlem başarısız oldu.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    modalKapat();
    await etkinlikleriYukle();

  } catch (err) {
    console.error(err);
  } finally {
    kaydetBtn.disabled = false;
    kaydetBtn.textContent = 'Kaydet';
  }
}

/* ---------------- Durum güncelle ---------------- */
async function durumGuncelle(id, yeniDurum) {
  try {
    const yanit = await apiIstek(`/admin/etkinlikler/${id}/durum`, {
      method: 'PATCH',
      body: JSON.stringify({ durum: yeniDurum })
    });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'İşlem başarısız oldu.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    await etkinlikleriYukle();
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Silme ---------------- */
async function etkinlikSilOnay(id) {
  const etkinlik = TUM_ETKINLIKLER.find(e => e.id === id);
  if (!etkinlik) return;

  const onay = confirm(`"${etkinlik.baslik}" etkinliğini silmek istediğinize emin misiniz?`);
  if (!onay) return;

  try {
    const yanit = await apiIstek(`/admin/etkinlikler/${id}`, { method: 'DELETE' });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Silme işlemi başarısız oldu.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    await etkinlikleriYukle();
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Yardımcı: tarih biçimlendirme ---------------- */
function tarihSaatFormatla(isoTarih) {
  if (!isoTarih) return '-';
  const d = new Date(isoTarih);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// MySQL'den gelen "YYYY-MM-DD HH:MM:SS" formatını <input type="datetime-local"> için "YYYY-MM-DDTHH:MM"e çevirir
function isoToDatetimeLocal(mysqlTarih) {
  if (!mysqlTarih) return '';
  return mysqlTarih.replace(' ', 'T').slice(0, 16);
}