let TUM_ETKINLIKLER = [];

const E_DURUM_ETIKET = { onaylandi: 'Onaylandı', beklemede: 'Onay Bekliyor', reddedildi: 'Reddedildi', tamamlandi: 'Tamamlandı', iptal: 'İptal Edildi' };
const E_DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', tamamlandi: 'd-tamamlandi', iptal: 'd-iptal' };

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('etkinlikler');
  await etkinlikleriYukle();

  document.getElementById('yeniEtkinlikBtn').addEventListener('click', () => modalAc());
  document.getElementById('modalKapatBtn').addEventListener('click', modalKapat);
  document.getElementById('modalIptalBtn').addEventListener('click', modalKapat);
  document.getElementById('etkinlikForm').addEventListener('submit', formGonder);
});

async function etkinlikleriYukle() {
  try {
    const yanit = await apiIstek('/baskan/etkinlikler');
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Etkinlikler alınamadı.', 'hata');
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
    govde.innerHTML = `<tr class="bos-satir"><td colspan="5">Henüz etkinlik oluşturmadınız.</td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(e => `
    <tr>
      <td>${e.baslik}</td>
      <td>${tarihSaatFormatla(e.tarih)}</td>
      <td>${e.konum || '-'}</td>
      <td><span class="rozet-etiket ${E_DURUM_SINIF[e.durum]}">${E_DURUM_ETIKET[e.durum]}</span></td>
      <td>
        <div class="eylem-grubu">
          ${['beklemede', 'reddedildi'].includes(e.durum) ? `
            <button class="btn btn-ikincil btn-kucuk" onclick="modalAc(${e.id})">Düzenle</button>
          ` : ''}
          <button class="btn btn-tehlike btn-kucuk" onclick="etkinlikSilOnay(${e.id})">Sil</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function modalAc(id = null) {
  const form = document.getElementById('etkinlikForm');
  form.reset();
  document.getElementById('etkinlikId').value = '';

  if (id) {
    const etkinlik = TUM_ETKINLIKLER.find(e => e.id === id);
    if (!etkinlik) return;

    document.getElementById('modalBaslik').textContent = 'Etkinliği Düzenle';
    document.getElementById('etkinlikId').value = etkinlik.id;
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

async function formGonder(e) {
  e.preventDefault();

  const id = document.getElementById('etkinlikId').value;
  const gövde = {
    baslik: document.getElementById('baslik').value.trim(),
    aciklama: document.getElementById('aciklama').value.trim(),
    tarih: document.getElementById('tarih').value,
    konum: document.getElementById('konum').value.trim()
  };

  const kaydetBtn = document.getElementById('kaydetBtn');
  kaydetBtn.disabled = true;
  kaydetBtn.textContent = 'Kaydediliyor...';

  try {
    const yanit = await apiIstek(id ? `/baskan/etkinlikler/${id}` : '/baskan/etkinlikler', {
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

async function etkinlikSilOnay(id) {
  const etkinlik = TUM_ETKINLIKLER.find(e => e.id === id);
  if (!etkinlik) return;

  const onay = confirm(`"${etkinlik.baslik}" etkinliğini silmek istediğinize emin misiniz?`);
  if (!onay) return;

  try {
    const yanit = await apiIstek(`/baskan/etkinlikler/${id}`, { method: 'DELETE' });
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