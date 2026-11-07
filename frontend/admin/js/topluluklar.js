let TUM_TOPLULUKLAR = [];

const DURUM_ETIKET = { onaylandi: 'Onaylandı', beklemede: 'Beklemede', reddedildi: 'Reddedildi', pasif: 'Pasif' };
const DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', pasif: 'd-pasif' };

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('topluluklar');
  await toplulukalriYukle();
  await secimListeleriniDoldur();

  document.getElementById('yeniTopluluqBtn').addEventListener('click', () => modalAc());
  document.getElementById('modalKapatBtn').addEventListener('click', modalKapat);
  document.getElementById('modalIptalBtn').addEventListener('click', modalKapat);
  document.getElementById('topluluqForm').addEventListener('submit', formGonder);
  document.getElementById('durumFiltre').addEventListener('change', toplulukalriYukle);
});

/* ---------------- Listeleme ---------------- */
async function toplulukalriYukle() {
  const durum = document.getElementById('durumFiltre').value;
  const parametreler = new URLSearchParams();
  if (durum) parametreler.set('durum', durum);

  try {
    const yanit = await apiIstek(`/admin/topluluklar?${parametreler.toString()}`);
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster('Topluluklar alınamadı.', 'hata');
      return;
    }

    TUM_TOPLULUKLAR = veri.topluluklar;
    tabloyuCiz(TUM_TOPLULUKLAR);
  } catch (err) {
    console.error(err);
  }
}

function tabloyuCiz(liste) {
  const govde = document.getElementById('topluluklarGovde');

  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="7">Kayıt bulunamadı.</td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(t => `
    <tr>
      <td>${t.ad}</td>
      <td>${t.baskan_ad ? `${t.baskan_ad} ${t.baskan_soyad}` : '-'}</td>
      <td>${t.danisman_ad ? `${t.danisman_ad} ${t.danisman_soyad}` : '-'}</td>
      <td>${t.uyeSayisi}</td>
      <td><span class="rozet-etiket ${DURUM_SINIF[t.durum]}">${DURUM_ETIKET[t.durum]}</span></td>
      <td>${tarihFormatla(t.kurulis_tarihi)}</td>
      <td>
        <div class="eylem-grubu">
          ${t.durum === 'beklemede' ? `
            <button class="btn btn-basari btn-kucuk" onclick="durumGuncelle(${t.id}, 'onaylandi')">Onayla</button>
            <button class="btn btn-tehlike btn-kucuk" onclick="durumGuncelle(${t.id}, 'reddedildi')">Reddet</button>
          ` : ''}
          <button class="btn btn-ikincil btn-kucuk" onclick="modalAc(${t.id})">Düzenle</button>
          <button class="btn btn-tehlike btn-kucuk" onclick="topluluqSilOnay(${t.id})">Sil</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ---------------- Başkan / danışman seçim listeleri ---------------- */
async function secimListeleriniDoldur() {
  try {
    const [baskanYanit, danismanYanit] = await Promise.all([
      apiIstek('/admin/kullanicilar/secenekler?rol=baskan'),
      apiIstek('/admin/kullanicilar/secenekler?rol=danisman')
    ]);

    const baskanVeri = await baskanYanit.json();
    const danismanVeri = await danismanYanit.json();

    const baskanSecim = document.getElementById('baskanSecim');
    const danismanSecim = document.getElementById('danismanSecim');

    if (baskanVeri.basarili) {
      baskanVeri.kullanicilar.forEach(k => {
        baskanSecim.innerHTML += `<option value="${k.id}">${k.ad} ${k.soyad} (${k.email})</option>`;
      });
    }
    if (danismanVeri.basarili) {
      danismanVeri.kullanicilar.forEach(k => {
        danismanSecim.innerHTML += `<option value="${k.id}">${k.ad} ${k.soyad} (${k.email})</option>`;
      });
    }
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Modal ---------------- */
function modalAc(id = null) {
  const form = document.getElementById('topluluqForm');
  form.reset();
  document.getElementById('topluluqId').value = '';

  if (id) {
    const topluluk = TUM_TOPLULUKLAR.find(t => t.id === id);
    if (!topluluk) return;

    document.getElementById('modalBaslik').textContent = 'Topluluğu Düzenle';
    document.getElementById('topluluqId').value = topluluk.id;
    document.getElementById('ad').value = topluluk.ad;
    document.getElementById('aciklama').value = topluluk.aciklama || '';
    document.getElementById('baskanSecim').value = topluluk.baskan_id || '';
    document.getElementById('danismanSecim').value = topluluk.danisman_id || '';
  } else {
    document.getElementById('modalBaslik').textContent = 'Yeni Topluluk';
  }

  document.getElementById('topluluqModal').classList.add('acik');
}

function modalKapat() {
  document.getElementById('topluluqModal').classList.remove('acik');
}

/* ---------------- Form gönder ---------------- */
async function formGonder(e) {
  e.preventDefault();

  const id = document.getElementById('topluluqId').value;
  const gövde = {
    ad: document.getElementById('ad').value.trim(),
    aciklama: document.getElementById('aciklama').value.trim(),
    baskan_id: document.getElementById('baskanSecim').value || null,
    danisman_id: document.getElementById('danismanSecim').value || null
  };

  const kaydetBtn = document.getElementById('kaydetBtn');
  kaydetBtn.disabled = true;
  kaydetBtn.textContent = 'Kaydediliyor...';

  try {
    const yanit = await apiIstek(id ? `/admin/topluluklar/${id}` : '/admin/topluluklar', {
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
    await toplulukalriYukle();

  } catch (err) {
    console.error(err);
  } finally {
    kaydetBtn.disabled = false;
    kaydetBtn.textContent = 'Kaydet';
  }
}

/* ---------------- Durum güncelle (onayla / reddet) ---------------- */
async function durumGuncelle(id, yeniDurum) {
  try {
    const yanit = await apiIstek(`/admin/topluluklar/${id}/durum`, {
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
    await toplulukalriYukle();
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Silme ---------------- */
async function topluluqSilOnay(id) {
  const topluluk = TUM_TOPLULUKLAR.find(t => t.id === id);
  if (!topluluk) return;

  const onay = confirm(`"${topluluk.ad}" topluluğunu silmek istediğinize emin misiniz?\nBu işlem geri alınamaz ve tüm üyelik/etkinlik kayıtlarını da silecektir.`);
  if (!onay) return;

  try {
    const yanit = await apiIstek(`/admin/topluluklar/${id}`, { method: 'DELETE' });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Silme işlemi başarısız oldu.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    await toplulukalriYukle();
  } catch (err) {
    console.error(err);
  }
}