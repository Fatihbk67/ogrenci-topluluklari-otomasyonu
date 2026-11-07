document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('dashboard');
  await istatistikleriYukle();
});

const DURUM_ETIKET = { onaylandi: 'Onaylandı', beklemede: 'Beklemede', reddedildi: 'Reddedildi', ayrildi: 'Ayrıldı' };
const DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', ayrildi: 'd-pasif' };

async function istatistikleriYukle() {
  try {
    const yanit = await apiIstek('/baskan/istatistikler');
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'İstatistikler alınamadı.', 'hata');
      return;
    }

    document.getElementById('topluluqAltBaslik').textContent = `${veri.topluluk.ad} topluluğuna hızlı bir bakış.`;

    const bilgiPanel = document.getElementById('topluluqBilgiPanel');
    bilgiPanel.style.display = 'block';
    document.getElementById('topluluqAciklama').textContent = veri.topluluk.aciklama || 'Henüz bir açıklama girilmemiş.';
    document.getElementById('topluluqDanisman').textContent = veri.topluluk.danisman_ad
      ? `${veri.topluluk.danisman_ad} ${veri.topluluk.danisman_soyad} (${veri.topluluk.danisman_email})`
      : 'Henüz atanmamış';

    kartlariCiz(veri.istatistikler);
    basvurulariCiz(veri.sonBasvurular);

  } catch (err) {
    console.error(err);
  }
}

function kartlariCiz(ist) {
  const izgara = document.getElementById('istatistikIzgara');
  izgara.innerHTML = `
    <div class="ist-kart vurgu">
      <div class="ist-kart-etiket">Toplam Üye</div>
      <div class="ist-kart-deger">${ist.toplamUye}</div>
      <div class="ist-kart-alt">Onaylı üye sayısı</div>
    </div>
    <div class="ist-kart ist-kart-tiklanabilir" onclick="window.location.href='uyeler.html'">
      <div class="ist-kart-etiket">Bekleyen Başvuru</div>
      <div class="ist-kart-deger">${ist.bekleyenBasvuru}</div>
      <div class="ist-kart-alt">İncelemek için tıklayın &rarr;</div>
    </div>
    <div class="ist-kart">
      <div class="ist-kart-etiket">Toplam Etkinlik</div>
      <div class="ist-kart-deger">${ist.toplamEtkinlik}</div>
      <div class="ist-kart-alt">Tüm zamanlar</div>
    </div>
    <div class="ist-kart ist-kart-tiklanabilir" onclick="window.location.href='etkinlikler.html'">
      <div class="ist-kart-etiket">Onay Bekleyen Etkinlik</div>
      <div class="ist-kart-deger">${ist.onayBekleyenEtkinlik}</div>
      <div class="ist-kart-alt">Yönetici onayı bekliyor &rarr;</div>
    </div>
  `;
}

function basvurulariCiz(liste) {
  const govde = document.getElementById('sonBasvurularGovde');
  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="4">Henüz başvuru yok.</td></tr>`;
    return;
  }
  govde.innerHTML = liste.map(b => `
    <tr>
      <td>${b.ad} ${b.soyad}</td>
      <td>${b.email}</td>
      <td><span class="rozet-etiket ${DURUM_SINIF[b.durum]}">${DURUM_ETIKET[b.durum]}</span></td>
      <td>${tarihFormatla(b.katilim_tarihi)}</td>
    </tr>
  `).join('');
}