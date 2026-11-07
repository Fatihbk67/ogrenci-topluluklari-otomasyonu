let TUM_KULLANICILAR = [];

const ROL_ETIKET = { admin: 'Admin', danisman: 'Danışman', baskan: 'Başkan', ogrenci: 'Öğrenci' };
const ROL_SINIF = { admin: 'r-admin', danisman: 'r-danisman', baskan: 'r-baskan', ogrenci: 'r-ogrenci' };

document.addEventListener('DOMContentLoaded', async () => {
  const token = oturumDogrula();
  if (!token) return;

  aktifMenuIsaretle('kullanicilar');
  await kullanicilariYukle();

  document.getElementById('modalKapatBtn').addEventListener('click', modalKapat);
  document.getElementById('modalIptalBtn').addEventListener('click', modalKapat);
  document.getElementById('kullaniciForm').addEventListener('submit', formGonder);

  document.getElementById('aramaKutusu').addEventListener('input', debounce(kullanicilariYukle, 350));
  document.getElementById('rolFiltre').addEventListener('change', kullanicilariYukle);
});

/* ---------------- Listeleme ---------------- */
async function kullanicilariYukle() {
  const arama = document.getElementById('aramaKutusu').value.trim();
  const rol = document.getElementById('rolFiltre').value;

  const parametreler = new URLSearchParams();
  if (arama) parametreler.set('arama', arama);
  if (rol) parametreler.set('rol', rol);

  try {
    const yanit = await apiIstek(`/admin/kullanicilar?${parametreler.toString()}`);
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster('Kullanıcılar alınamadı.', 'hata');
      return;
    }

    TUM_KULLANICILAR = veri.kullanicilar;
    tabloyuCiz(TUM_KULLANICILAR);
  } catch (err) {
    console.error(err);
  }
}

function tabloyuCiz(liste) {
  const govde = document.getElementById('kullanicilarGovde');

  // Önceki DataTable örneği varsa yeniden çizmeden önce yok et
  if ($.fn.DataTable.isDataTable('#kullanicilarTablosu')) {
    $('#kullanicilarTablosu').DataTable().destroy();
  }

  if (!liste || liste.length === 0) {
    govde.innerHTML = `<tr class="bos-satir"><td colspan="7">Kayıt bulunamadı.</td></tr>`;
    return;
  }

  govde.innerHTML = liste.map(k => `
    <tr>
      <td>${k.ad} ${k.soyad}</td>
      <td>${k.email}</td>
      <td>${k.ogrenci_no || '-'}</td>
      <td><span class="rozet-etiket ${ROL_SINIF[k.rol]}">${ROL_ETIKET[k.rol]}</span></td>
      <td>${k.bolum || '-'}</td>
      <td><span class="rozet-etiket ${k.aktif ? 'd-onaylandi' : 'd-pasif'}">${k.aktif ? 'Aktif' : 'Pasif'}</span></td>
      <td>
        <div class="eylem-grubu">
          <button class="btn btn-ikincil btn-kucuk" onclick="modalAc(${k.id})">Düzenle</button>
          <button class="btn btn-tehlike btn-kucuk" onclick="kullaniciSilOnay(${k.id})">Sil</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Kullanıcı listesini DataTable ile (arama/sıralama/sayfalama) göster.
  // Arama ve rol filtresi kendi arayüzümüzden (arac-cubugu) sunucuya gönderildiği için
  // DataTable'ın kendi arama/uzunluk kutuları gizlenip yalnızca sıralama + sayfalama kullanılır.
  $('#kullanicilarTablosu').DataTable({
    autoWidth: false,
    ordering: true,
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

/* ---------------- Modal (düzenle) ---------------- */
function modalAc(id) {
  const form = document.getElementById('kullaniciForm');
  form.reset();

  const kullanici = TUM_KULLANICILAR.find(k => k.id === id);
  if (!kullanici) return;

  document.getElementById('kullaniciId').value = kullanici.id;
  document.getElementById('ad').value = kullanici.ad;
  document.getElementById('soyad').value = kullanici.soyad;
  document.getElementById('email').value = kullanici.email;
  document.getElementById('rol').value = kullanici.rol;
  document.getElementById('ogrenciNo').value = kullanici.ogrenci_no || '';
  document.getElementById('telefon').value = kullanici.telefon || '';
  document.getElementById('bolum').value = kullanici.bolum || '';
  document.getElementById('aktif').checked = !!kullanici.aktif;

  document.getElementById('kullaniciModal').classList.add('acik');
}

function modalKapat() {
  document.getElementById('kullaniciModal').classList.remove('acik');
}

/* ---------------- Form gönder (güncelle) ---------------- */
async function formGonder(e) {
  e.preventDefault();

  const id = document.getElementById('kullaniciId').value;
  const gövde = {
    ad: document.getElementById('ad').value.trim(),
    soyad: document.getElementById('soyad').value.trim(),
    email: document.getElementById('email').value.trim(),
    rol: document.getElementById('rol').value,
    ogrenci_no: document.getElementById('ogrenciNo').value.trim(),
    telefon: document.getElementById('telefon').value.trim(),
    bolum: document.getElementById('bolum').value.trim(),
    sifre: document.getElementById('sifre').value,
    aktif: document.getElementById('aktif').checked
  };

  if (gövde.sifre && gövde.sifre.length < 6) {
    bildirimGoster('Şifre en az 6 karakter olmalıdır.', 'hata');
    return;
  }

  const kaydetBtn = document.getElementById('kaydetBtn');
  kaydetBtn.disabled = true;
  kaydetBtn.textContent = 'Kaydediliyor...';

  try {
    const yanit = await apiIstek(`/admin/kullanicilar/${id}`, {
      method: 'PUT',
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
    await kullanicilariYukle();

  } catch (err) {
    console.error(err);
  } finally {
    kaydetBtn.disabled = false;
    kaydetBtn.textContent = 'Kaydet';
  }
}

/* ---------------- Silme ---------------- */
async function kullaniciSilOnay(id) {
  const kullanici = TUM_KULLANICILAR.find(k => k.id === id);
  if (!kullanici) return;

  const onay = confirm(`"${kullanici.ad} ${kullanici.soyad}" adlı kullanıcıyı silmek istediğinize emin misiniz?\nBu işlem geri alınamaz.`);
  if (!onay) return;

  try {
    const yanit = await apiIstek(`/admin/kullanicilar/${id}`, { method: 'DELETE' });
    if (!yanit) return;
    const veri = await yanit.json();

    if (!veri.basarili) {
      bildirimGoster(veri.mesaj || 'Silme işlemi başarısız oldu.', 'hata');
      return;
    }

    bildirimGoster(veri.mesaj, 'basarili');
    await kullanicilariYukle();
  } catch (err) {
    console.error(err);
  }
}

/* ---------------- Yardımcı: debounce ---------------- */
function debounce(fn, gecikme) {
  let zamanlayici;
  return (...args) => {
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(() => fn(...args), gecikme);
  };
}