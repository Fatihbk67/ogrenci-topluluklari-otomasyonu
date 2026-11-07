const DURUM_ETIKET = { onaylandi: 'Onaylı Üye', beklemede: 'Başvuru İnceleniyor', reddedildi: 'Reddedildi', ayrildi: 'Ayrılındı' };
const DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', ayrildi: 'd-pasif' };

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('dashboard');
  await ozetiYukle();
});

async function ozetiYukle() {
  try {
    const yanit = await apiIstek('/ogrenci/topluluklar');
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Bilgiler alınamadı.', 'hata');
      return;
    }

    const tumTopluluklar = veri.topluluklar;
    const uyeliklerim = tumTopluluklar.filter(t => t.uyelik_durumu);

    kartlariCiz(tumTopluluklar, uyeliklerim);
    uyeliklerimiCiz(uyeliklerim);

  } catch (err) {
    console.error(err);
  }
}

function kartlariCiz(tumTopluluklar, uyeliklerim) {
  const onayliSayisi = uyeliklerim.filter(t => t.uyelik_durumu === 'onaylandi').length;
  const bekleyenSayisi = uyeliklerim.filter(t => t.uyelik_durumu === 'beklemede').length;

  const izgara = document.getElementById('istatistikIzgara');
  izgara.innerHTML = `
    <div class="ist-kart vurgu">
      <div class="ist-kart-etiket">Üye Olduğunuz Topluluk</div>
      <div class="ist-kart-deger">${onayliSayisi}</div>
      <div class="ist-kart-alt">Onaylı üyelikleriniz</div>
    </div>
    <div class="ist-kart ist-kart-tiklanabilir" onclick="window.location.href='topluluklar.html'">
      <div class="ist-kart-etiket">Bekleyen Başvuru</div>
      <div class="ist-kart-deger">${bekleyenSayisi}</div>
      <div class="ist-kart-alt">İncelemek için tıklayın &rarr;</div>
    </div>
    <div class="ist-kart ist-kart-tiklanabilir" onclick="window.location.href='topluluklar.html'">
      <div class="ist-kart-etiket">Kampüsteki Topluluk Sayısı</div>
      <div class="ist-kart-deger">${tumTopluluklar.length}</div>
      <div class="ist-kart-alt">Keşfetmek için tıklayın &rarr;</div>
    </div>
  `;
}

function uyeliklerimiCiz(liste) {
  const govde = document.getElementById('uyeliklerimGovde');

  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="3">Henüz bir topluluğa başvurmadınız. <a href="topluluklar.html">Toplulukları keşfedin &rarr;</a></td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(t => `
    <tr>
      <td>${t.ad}</td>
      <td>${t.baskan_ad ? `${t.baskan_ad} ${t.baskan_soyad}` : '-'}</td>
      <td><span class="rozet-etiket ${DURUM_SINIF[t.uyelik_durumu]}">${DURUM_ETIKET[t.uyelik_durumu]}</span></td>
    </tr>
  `).join('');
}