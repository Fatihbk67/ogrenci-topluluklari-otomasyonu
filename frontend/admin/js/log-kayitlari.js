let ARAMA_ZAMANLAYICI = null;

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('log-kayitlari');
  await kayitlariYukle();

  document.getElementById('aramaKutusu').addEventListener('input', () => {
    clearTimeout(ARAMA_ZAMANLAYICI);
    ARAMA_ZAMANLAYICI = setTimeout(kayitlariYukle, 400);
  });
  document.getElementById('rolFiltre').addEventListener('change', kayitlariYukle);
  document.getElementById('baslangicTarihi').addEventListener('change', kayitlariYukle);
  document.getElementById('bitisTarihi').addEventListener('change', kayitlariYukle);
  document.getElementById('yenileBtn').addEventListener('click', kayitlariYukle);
  document.getElementById('filtreTemizleBtn').addEventListener('click', () => {
    document.getElementById('aramaKutusu').value = '';
    document.getElementById('rolFiltre').value = '';
    document.getElementById('baslangicTarihi').value = '';
    document.getElementById('bitisTarihi').value = '';
    kayitlariYukle();
  });
});

async function kayitlariYukle() {
  try {
    const arama = document.getElementById('aramaKutusu').value.trim();
    const rol = document.getElementById('rolFiltre').value;
    const baslangic = document.getElementById('baslangicTarihi').value;
    const bitis = document.getElementById('bitisTarihi').value;

    const parametreler = new URLSearchParams();
    if (arama) parametreler.set('arama', arama);
    if (rol) parametreler.set('rol', rol);
    if (baslangic) parametreler.set('baslangic', baslangic);
    if (bitis) parametreler.set('bitis', bitis);

    const yanit = await apiIstek(`/admin/log-kayitlari?${parametreler.toString()}`);
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Log kayıtları alınamadı.', 'hata');
      return;
    }

    ozetGuncelle(veri);
    tabloyuCiz(veri.kayitlar);

  } catch (err) {
    console.error(err);
  }
}

function ozetGuncelle(veri) {
  const basarisizSayisi = veri.kayitlar.filter(k => !k.basarili).length;
  document.getElementById('ozetToplam').textContent = veri.toplamKayit ?? '-';
  document.getElementById('ozetGosterilen').textContent = veri.kayitlar.length;
  document.getElementById('ozetBasarisiz').textContent = basarisizSayisi;
}

function tabloyuCiz(liste) {
  const govde = document.getElementById('logGovde');

  if ($.fn.DataTable.isDataTable('#logTablosu')) {
    $('#logTablosu').DataTable().destroy();
  }

  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="9">Filtrenizle eşleşen kayıt bulunamadı.</td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(k => {
    const tarayici = tarayiciOzetiCikar(k.tarayici_bilgisi);
    const kullaniciSatiri = k.kullanici_adi
      ? `${k.kullanici_adi}${k.kullanici_email ? `<br><span class="lk-alt-metin">${k.kullanici_email}</span>` : ''}`
      : '<span class="lk-alt-metin">Ziyaretçi</span>';

    return `
    <tr>
      <td class="lk-tarih">${tarihSaatFormatla(k.olusturma_tarihi)}</td>
      <td>${kullaniciSatiri}</td>
      <td>${k.rol ? `<span class="rozet-etiket ${ROL_SINIF[k.rol] || ''}">${ROL_ETIKET[k.rol] || k.rol}</span>` : '<span class="lk-alt-metin">-</span>'}</td>
      <td><span class="yontem-etiket yontem-${k.yontem}">${k.yontem}</span></td>
      <td class="lk-eylem" title="${(k.eylem || '').replace(/"/g, '&quot;')}">${k.eylem}${k.detay ? `<br><span class="lk-alt-metin">${k.detay}</span>` : ''}</td>
      <td class="lk-ip">${k.ip_adresi || '-'}</td>
      <td class="lk-tarayici" title="${(k.tarayici_bilgisi || '').replace(/"/g, '&quot;')}">${tarayici}</td>
      <td class="lk-sure">${k.sure_ms != null ? `${k.sure_ms} ms` : '-'}</td>
      <td><span class="rozet-etiket ${k.basarili ? 'd-onaylandi' : 'd-reddedildi'}">${k.basarili ? 'Başarılı' : `Başarısız (${k.durum_kodu ?? '-'})`}</span></td>
    </tr>
  `;
  }).join('');

  $('#logTablosu').DataTable({
    autoWidth: false,
    searching: false,
    lengthChange: false,
    pageLength: 25,
    order: [], // veri zaten sunucudan en yeniden en eskiye sıralı geliyor
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

const ROL_ETIKET = { admin: 'Admin', danisman: 'Danışman', baskan: 'Başkan', ogrenci: 'Öğrenci' };
const ROL_SINIF = { admin: 'r-admin', danisman: 'r-danisman', baskan: 'r-baskan', ogrenci: 'r-ogrenci' };

/**
 * Ham User-Agent metnini "Chrome · Windows" gibi kısa, okunaklı bir özete çevirir.
 * Tam metin, hücrenin title (tooltip) özelliğinde saklanır.
 */
function tarayiciOzetiCikar(uaString) {
  if (!uaString) return 'Bilinmiyor';

  let tarayici = 'Bilinmeyen Tarayıcı';
  if (/Edg\//.test(uaString)) tarayici = 'Edge';
  else if (/OPR\//.test(uaString)) tarayici = 'Opera';
  else if (/Chrome\//.test(uaString)) tarayici = 'Chrome';
  else if (/Firefox\//.test(uaString)) tarayici = 'Firefox';
  else if (/Safari\//.test(uaString)) tarayici = 'Safari';

  let sistem = '';
  if (/Windows/.test(uaString)) sistem = 'Windows';
  else if (/Mac OS X/.test(uaString)) sistem = 'macOS';
  else if (/Android/.test(uaString)) sistem = 'Android';
  else if (/iPhone|iPad/.test(uaString)) sistem = 'iOS';
  else if (/Linux/.test(uaString)) sistem = 'Linux';

  return sistem ? `${tarayici} · ${sistem}` : tarayici;
}

/** Tarihi gün.ay.yıl saat:dakika formatında gösterir */
function tarihSaatFormatla(isoTarih) {
  if (!isoTarih) return '-';
  const d = new Date(isoTarih);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
