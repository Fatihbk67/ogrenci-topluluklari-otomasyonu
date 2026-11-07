let TUM_UYELER = [];

const DURUM_ETIKET = { onaylandi: 'Onaylandı', beklemede: 'Beklemede', reddedildi: 'Reddedildi', ayrildi: 'Ayrıldı' };
const DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', ayrildi: 'd-pasif' };

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('uyeler');
  await uyeleriYukle();

  document.getElementById('durumFiltre').addEventListener('change', uyeleriYukle);
});

async function uyeleriYukle() {
  const durum = document.getElementById('durumFiltre').value;
  const parametreler = new URLSearchParams();
  if (durum) parametreler.set('durum', durum);

  try {
    const yanit = await apiIstek(`/baskan/uyeler?${parametreler.toString()}`);
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Üyeler alınamadı.', 'hata');
      return;
    }

    TUM_UYELER = veri.uyeler;
    tabloyuCiz(TUM_UYELER);
  } catch (err) {
    console.error(err);
  }
}

function tabloyuCiz(liste) {
  const govde = document.getElementById('uyelerGovde');

  if ($.fn.DataTable.isDataTable('#uyelerTablosu')) {
    $('#uyelerTablosu').DataTable().destroy();
  }

  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="7">Kayıt bulunamadı.</td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(u => `
    <tr>
      <td>${u.ad} ${u.soyad}</td>
      <td>${u.email}</td>
      <td>${u.ogrenci_no || '-'}</td>
      <td>${u.bolum || '-'}</td>
      <td><span class="rozet-etiket ${DURUM_SINIF[u.durum]}">${DURUM_ETIKET[u.durum]}</span></td>
      <td>${tarihFormatla(u.katilim_tarihi)}</td>
      <td>
        <div class="eylem-grubu">
          ${u.durum === 'beklemede' ? `
            <button class="btn btn-basari btn-kucuk" onclick="durumGuncelle(${u.id}, 'onaylandi')">Onayla</button>
            <button class="btn btn-tehlike btn-kucuk" onclick="durumGuncelle(${u.id}, 'reddedildi')">Reddet</button>
          ` : ''}
          ${u.durum === 'onaylandi' ? `
            <button class="btn btn-tehlike btn-kucuk" onclick="durumGuncelle(${u.id}, 'ayrildi')">Üyelikten Çıkar</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  $('#uyelerTablosu').DataTable({
    autoWidth: false,
    searching: false,
    lengthChange: false,
    pageLength: 10,
    columnDefs: [{ orderable: false, targets: -1 }],
    language: {
      emptyTable: 'Kayıt bulunamadı.',
      zeroRecords: 'Eşleşen kayıt bulunamadı.',
      info: 'Toplam _TOTAL_ kayıttan _START_-_END_ arası gösteriliyor',
      infoEmpty: 'Kayıt yok',
      infoFiltered: '(_MAX_ kayıt içinden filtrelendi)',
      paginate: { previous: '‹ Önceki', next: 'Sonraki ›' }
    }
  });
}

async function durumGuncelle(id, yeniDurum) {
  try {
    const yanit = await apiIstek(`/baskan/uyeler/${id}/durum`, {
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
    await uyeleriYukle();
  } catch (err) {
    console.error(err);
  }
}