let TUM_TOPLULUKLAR = [];

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('topluluklar');
  await toplulukalriYukle();

  document.getElementById('aramaKutusu').addEventListener('input', aramayaGoreFiltrele);
});

async function toplulukalriYukle() {
  try {
    const yanit = await apiIstek('/ogrenci/topluluklar');
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Topluluklar alınamadı.', 'hata');
      return;
    }

    TUM_TOPLULUKLAR = veri.topluluklar;
    izgarayiCiz(TUM_TOPLULUKLAR);
  } catch (err) {
    console.error(err);
  }
}

function aramayaGoreFiltrele() {
  const terim = document.getElementById('aramaKutusu').value.trim().toLocaleLowerCase('tr-TR');
  if (!terim) {
    izgarayiCiz(TUM_TOPLULUKLAR);
    return;
  }
  const filtreli = TUM_TOPLULUKLAR.filter(t => t.ad.toLocaleLowerCase('tr-TR').includes(terim));
  izgarayiCiz(filtreli);
}

function izgarayiCiz(liste) {
  const izgara = document.getElementById('topluluklarIzgara');

  if (!liste || liste.length === 0) {
    izgara.innerHTML = `<div class="yukleniyor-metni">Aramanızla eşleşen topluluk bulunamadı.</div>`;
    return;
  }

  izgara.innerHTML = liste.map(t => {
    const gorselUrl = t.kapak_gorseli || t.logo_url || '';
    const gorselIcerik = gorselUrl
      ? `<img src="${gorselUrl}" alt="${t.ad}">`
      : (t.ad ? t.ad.charAt(0).toLocaleUpperCase('tr-TR') : '?');

    return `
    <div class="topluluk-kart" data-id="${t.id}" onclick="kartTiklandi(event, ${t.id})">
      <div class="tk-gorsel">${gorselIcerik}</div>
      <div class="tk-govde">
        <div class="tk-baslik-satiri">
          <h3>${t.ad}</h3>
          <span class="tk-daralt-ipucu">${t.detay_bilgi ? 'Detaylar için tıklayın &darr;' : ''}</span>
        </div>
        <p class="tk-kisa-aciklama">${t.aciklama || 'Bu topluluk henüz bir açıklama eklememiş.'}</p>
        <div class="alt-bilgi">
          Başkan: ${t.baskan_ad ? `${t.baskan_ad} ${t.baskan_soyad}` : 'Belirtilmemiş'}<br>
          Üye Sayısı: ${t.uyeSayisi}
        </div>
        <div class="eylem" onclick="event.stopPropagation()">${eylemButonuOlustur(t)}</div>

        <div class="tk-detay">
          <div class="tk-detay-icerik">
            <div>
              <p class="tk-detay-baslik">Topluluk Hakkında</p>
              <p class="tk-detay-metin">${t.detay_bilgi ? kacisliMetin(t.detay_bilgi) : 'Başkan henüz detaylı bir açıklama eklememiş.'}</p>
            </div>
            <div>
              <p class="tk-detay-baslik">İletişim</p>
              <p class="tk-iletisim-satir"><strong>İletişim:</strong> ${t.iletisim_bilgisi || 'Belirtilmemiş'}</p>
              <p class="tk-iletisim-satir"><strong>Sosyal Medya / Web:</strong> ${t.sosyal_medya || 'Belirtilmemiş'}</p>
              <p class="tk-iletisim-satir"><strong>Başkan:</strong> ${t.baskan_ad ? `${t.baskan_ad} ${t.baskan_soyad}` : 'Belirtilmemiş'}</p>
              <p class="tk-iletisim-satir"><strong>Üye Sayısı:</strong> ${t.uyeSayisi}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

/** Kart gövdesine tıklandığında (butonlar hariç) kartı genişletir / daraltır */
function kartTiklandi(evt, topluluqId) {
  const tiklananKart = evt.currentTarget;
  const zatenAcik = tiklananKart.classList.contains('genisletilmis');

  document.querySelectorAll('.topluluk-kart.genisletilmis').forEach(k => k.classList.remove('genisletilmis'));

  if (!zatenAcik) {
    tiklananKart.classList.add('genisletilmis');
    setTimeout(() => tiklananKart.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
  }
}

/** Basit HTML kaçışı (kullanıcı girdisi metin olarak güvenle gösterilsin) */
function kacisliMetin(metin) {
  const div = document.createElement('div');
  div.textContent = metin;
  return div.innerHTML;
}

function eylemButonuOlustur(t) {
  switch (t.uyelik_durumu) {
    case 'onaylandi':
      return `
        <span class="rozet-etiket d-onaylandi" style="margin-right:8px;">Üyesiniz</span>
        <button class="btn btn-tehlike btn-kucuk" onclick="ayrilmaFormuAc(${t.id})">Üyelikten Ayrıl</button>`;
    case 'beklemede':
      return `
        <span class="rozet-etiket d-beklemede" style="margin-right:8px;">Başvurunuz İnceleniyor</span>
        <button class="btn btn-ikincil btn-kucuk" onclick="basvuruIptalEt(${t.id})">Başvuruyu Geri Çek</button>`;
    case 'reddedildi':
      return `
        <span class="rozet-etiket d-reddedildi" style="margin-right:8px;">Başvurunuz Reddedildi</span>
        <button class="btn btn-birincil btn-kucuk" onclick="basvuruFormuAc(${t.id})">Tekrar Başvur</button>`;
    default:
      return `<button class="btn btn-birincil btn-kucuk" onclick="basvuruFormuAc(${t.id})">Üyelik Başvurusu Yap</button>`;
  }
}

async function basvuruYap(topluluqId) {
  try {
    const yanit = await apiIstek(`/ogrenci/topluluklar/${topluluqId}/basvuru`, { method: 'POST' });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Başvuru gönderilemedi.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    await toplulukalriYukle();
    aramayaGoreFiltrele();
  } catch (err) {
    console.error(err);
  }
}

/**
 * Üyelikten ayrılma / bekleyen başvuruyu geri çekme.
 * onayIleGeldi = true ise (kurumsal onay formu üzerinden geldiyse) tarayıcının
 * kendi confirm() penceresi tekrar sorulmaz, çünkü kullanıcı zaten formu onayladı.
 */
async function basvuruIptalEt(topluluqId, onayIleGeldi = false) {
  if (!onayIleGeldi) {
    const onay = confirm('Bu işlemi yapmak istediğinize emin misiniz?');
    if (!onay) return;
  }

  try {
    const yanit = await apiIstek(`/ogrenci/topluluklar/${topluluqId}/basvuru`, { method: 'DELETE' });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'İşlem başarısız oldu.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    await toplulukalriYukle();
    aramayaGoreFiltrele();
  } catch (err) {
    console.error(err);
  }
}

/* ================================================================
   KURUMSAL ONAY FORMU (Üyelik Başvurusu / Üyelikten Ayrılma)
================================================================ */

let ONAY_CALLBACK = null;

function toplulukBul(topluluqId) {
  return TUM_TOPLULUKLAR.find(t => t.id === topluluqId);
}

/** "Üyelik Başvurusu Yap" / "Tekrar Başvur" tıklanınca açılır */
function basvuruFormuAc(topluluqId) {
  const topluluk = toplulukBul(topluluqId);
  const toplulukAdi = topluluk ? kacisliMetin(topluluk.ad) : 'ilgili topluluk';

  document.getElementById('onayModalFormAdi').textContent = 'Öğrenci Toplulukları Üyelik Başvuru Formu';
  document.getElementById('onayModalBaslik').textContent = 'Üyelik Başvuru Formu';
  document.getElementById('onayModalMetin').innerHTML = `<strong>${toplulukAdi}</strong> öğrenci topluluğuna üyelik başvurusunda bulunuyorum. Bu başvuruyu yaparak;

1. Malatya Turgut Özal Üniversitesi Öğrenci Toplulukları Yönergesi'nde belirtilen kural ve yükümlülüklere uyacağımı,
2. Topluluk faaliyetlerine gönüllülük esasıyla katılacağımı, topluluk yönetimince belirlenen çalışma ilke ve kararlarına saygı göstereceğimi,
3. Üyelik sürecinde paylaştığım kişisel verilerin, ilgili mevzuata uygun şekilde üniversite ve topluluk yönetimi tarafından işlenmesine onay verdiğimi,
4. Üniversitenin ve topluluğun itibarını zedeleyecek davranışlarda bulunmayacağımı ve topluluk disiplin kurallarına uyacağımı,
5. Başvurumun topluluk başkanı ve/veya danışmanı tarafından değerlendirileceğini ve sonucunun tarafıma bildirileceğini

kabul, beyan ve taahhüt ederim.`;

  ONAY_CALLBACK = () => basvuruYap(topluluqId);
  onayModalAc();
}

/** "Üyelikten Ayrıl" tıklanınca açılır */
function ayrilmaFormuAc(topluluqId) {
  const topluluk = toplulukBul(topluluqId);
  const toplulukAdi = topluluk ? kacisliMetin(topluluk.ad) : 'ilgili topluluk';

  document.getElementById('onayModalFormAdi').textContent = 'Öğrenci Toplulukları Üyelikten Ayrılma Beyanı';
  document.getElementById('onayModalBaslik').textContent = 'Üyelikten Ayrılma Beyanı';
  document.getElementById('onayModalMetin').innerHTML = `<strong>${toplulukAdi}</strong> öğrenci topluluğundaki üyeliğimi kendi isteğimle sonlandırmak istiyorum. Bu beyanı yaparak;

1. Üyelikten ayrılma talebimin, işleme alındığı andan itibaren geçerli olacağını,
2. Topluluk bünyesinde üstlendiğim görev, sorumluluk ve/veya emanet edilen malzeme varsa bunları eksiksiz şekilde topluluk yönetimine teslim edeceğimi,
3. Ayrılış sonrasında topluluğa ait ortak alan, iletişim kanalı ve etkinliklere üye sıfatıyla katılamayacağımı,
4. Dilediğim zaman yeni bir başvuru ile topluluğa tekrar üyelik başvurusunda bulunabileceğimi

kabul ve beyan ederim.`;

  ONAY_CALLBACK = () => basvuruIptalEt(topluluqId, true);
  onayModalAc();
}

function onayModalAc() {
  const kutu = document.getElementById('onayCheckbox');
  kutu.checked = false;
  onayButonDurumu();
  document.getElementById('onayModalArka').classList.add('acik');
}

function onayModalKapat() {
  document.getElementById('onayModalArka').classList.remove('acik');
  ONAY_CALLBACK = null;
}

function onayButonDurumu() {
  const kutu = document.getElementById('onayCheckbox');
  document.getElementById('onayOnaylaBtn').disabled = !kutu.checked;
}

function onayModalOnayla() {
  const kutu = document.getElementById('onayCheckbox');
  if (!kutu.checked || !ONAY_CALLBACK) return;

  const callback = ONAY_CALLBACK;
  onayModalKapat();
  callback();
}