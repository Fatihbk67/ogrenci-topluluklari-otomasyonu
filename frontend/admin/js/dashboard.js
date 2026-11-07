document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('dashboard');
  await istatistikleriYukle();
});

const ROL_ETIKET = { admin: 'Admin', danisman: 'Danışman', baskan: 'Başkan', ogrenci: 'Öğrenci' };
const ROL_SINIF = { admin: 'r-admin', danisman: 'r-danisman', baskan: 'r-baskan', ogrenci: 'r-ogrenci' };
const DURUM_ETIKET = { onaylandi: 'Onaylandı', beklemede: 'Beklemede', reddedildi: 'Reddedildi', pasif: 'Pasif' };
const DURUM_SINIF = { onaylandi: 'd-onaylandi', beklemede: 'd-beklemede', reddedildi: 'd-reddedildi', pasif: 'd-pasif' };

async function istatistikleriYukle() {
  try {
    const yanit = await apiIstek('/admin/istatistikler');
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster('İstatistikler alınamadı.', 'hata');
      return;
    }

    kartlariCiz(veri.istatistikler);
    sonKullanicilariCiz(veri.sonKullanicilar);
    sonToplulukalriCiz(veri.sonTopluluklar);

  } catch (err) {
    console.error(err);
  }
}

function kartlariCiz(ist) {
  const izgara = document.getElementById('istatistikIzgara');
  izgara.innerHTML = `
    <div class="ist-kart vurgu">
      <div class="ist-kart-etiket">Toplam Kullanıcı</div>
      <div class="ist-kart-deger">${ist.toplamKullanici}</div>
      <div class="ist-kart-alt">Sistemde kayıtlı tüm hesaplar</div>
    </div>
    <div class="ist-kart">
      <div class="ist-kart-etiket">Toplam Topluluk</div>
      <div class="ist-kart-deger">${ist.toplamTopluluk}</div>
      <div class="ist-kart-alt">Onaylı ve beklemedeki topluluklar</div>
    </div>
    <div class="ist-kart ist-kart-tiklanabilir" onclick="window.location.href='topluluklar.html'">
      <div class="ist-kart-etiket">Onay Bekleyen Topluluk</div>
      <div class="ist-kart-deger">${ist.bekleyenTopluluk}</div>
      <div class="ist-kart-alt">İncelemek için tıklayın &rarr;</div>
    </div>
    <div class="ist-kart ist-kart-tiklanabilir" onclick="window.location.href='etkinlikler.html'">
      <div class="ist-kart-etiket">Onay Bekleyen Etkinlik</div>
      <div class="ist-kart-deger">${ist.bekleyenEtkinlik}</div>
      <div class="ist-kart-alt">İncelemek için tıklayın &rarr;</div>
    </div>
    <div class="ist-kart">
      <div class="ist-kart-etiket">Toplam Öğrenci</div>
      <div class="ist-kart-deger">${ist.toplamOgrenci}</div>
      <div class="ist-kart-alt">Öğrenci rolündeki kullanıcılar</div>
    </div>
  `;
}

function sonKullanicilariCiz(liste) {
  const govde = document.getElementById('sonKullanicilarGovde');
  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="4">Henüz kullanıcı yok.</td></tr>`;
    return;
  }
  govde.innerHTML = liste.map(k => `
    <tr>
      <td>${k.ad} ${k.soyad}</td>
      <td>${k.email}</td>
      <td><span class="rozet-etiket ${ROL_SINIF[k.rol]}">${ROL_ETIKET[k.rol]}</span></td>
      <td>${tarihFormatla(k.olusturma_tarihi)}</td>
    </tr>
  `).join('');
}

function sonToplulukalriCiz(liste) {
  const govde = document.getElementById('sonTopluluklarGovde');
  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="3">Henüz topluluk yok.</td></tr>`;
    return;
  }
  govde.innerHTML = liste.map(t => `
    <tr>
      <td>${t.ad}</td>
      <td><span class="rozet-etiket ${DURUM_SINIF[t.durum]}">${DURUM_ETIKET[t.durum]}</span></td>
      <td>${tarihFormatla(t.kurulis_tarihi)}</td>
    </tr>
  `).join('');
}