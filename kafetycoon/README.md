# Köşe Kafe Tycoon

Tarayıcıda oynanan, mobil öncelikli bir kafe tycoon oyunu. Müşterileri ağırla, kafeni büyüt, kazandığın parayı şehirde harca.

Tek dosyadan oluşur (`index.html`), derleme veya kurulum gerektirmez.

## Çalıştırma

- **En kolayı:** `index.html` dosyasına çift tıkla, tarayıcıda açılır.
- **Yerel sunucuyla:**
  ```bash
  cd kafetycoon
  python3 -m http.server 8000
  ```
  Sonra tarayıcıda `http://localhost:8000` adresini aç.

Yazı tipleri Google Fonts'tan, Supabase istemcisi jsDelivr'den yüklenir. Çevrimdışıysan sistem yazı tipine düşer ve bulut özellikleri kapanır, oyun yerel kayıtla çalışmaya devam eder.

## Oyun döngüsü

```
Müşteri gelir → kuyruğa girer → barista sipariş hazırlar → masaya oturur → bahşiş bırakır
        ↓
   Para kazanılır → menüye, mekana, kafeye harcanır → seviye atlanır
        ↓
   Fazla para Dünya'da varlığa yatırılır → pasif gelir + prestij → kafeye daha çok müşteri
        ↓
   Her şey maksimuma gelince franchise: yeni şehirde yeniden başla, kalıcı bonus kazan
```

## Sistemler

### Kafe (sahne)
- Yukarıdan görünen kafede müşteriler yürür, kuyruğa girer, oturur ve çıkar.
- Kuyruk 5 kişiyi aşarsa müşteri gelmeden gider, beklemekten sıkılan müşteri itibar düşürür.
- Masa yoksa müşteri paket alıp çıkar.
- Her gün 90 saniye sürer, ortasında yoğun saat vardır.
- Günlük olaylar: Normal gün, Yağmurlu gün, Hafta sonu, Festival, Öğrenci haftası.
- VIP müşteriler 2,5 kat öder ama sabırsızdır.

### Yatırım sekmesi
| Kalem | Seviye | Etkisi |
|---|---|---|
| Masa | 15'e kadar (mekana bağlı) | Oturma kapasitesi, bahşiş |
| Mekan genişletme | 4 mekan | Köşe kafe (6 masa), Geniş salon (9), Teras katı (12), Büyük kafe (15) |
| Barista | 3 | Paralel sipariş hattı |
| Espresso makinesi | 7 | Servis hızı, içecek kalitesi |
| Pasta vitrini | 4 | Yiyecek satışı, yiyecek kalitesi |
| Dekor | 6 | Müşteri sayısı, bahşiş |

Gelişmiş yatırımlar belirli oyuncu seviyesi ister.

### Menü sekmesi
- 5 içecek: Espresso, Türk kahvesi, Latte, Soğuk kahve, Matcha latte.
- 5 yiyecek: Kurabiye, Brownie, Cheesecake, Sandviç, Kahvaltı tabağı (vitrin gerekir).
- Menü çeşitlendikçe gelen müşteri sayısı artar.

### Fiyat sekmesi
- Her ürünün fiyatı oyuncu tarafından ayarlanır (adil fiyatın %50'si ile %300'ü arası).
- Ucuz satmak müşteri sayısını artırır, pahalı satmak azaltır. Çok pahalı satmak itibarı düşürür.
- Servis kapasitesi doluysa fiyat artırmak kazancı yükseltir. Müşteri kaçıyorsa fiyat düşürmek daha iyidir.

### Dünya sekmesi (parayı harcama)
Şehir haritasında 14 varlık satın alınır. Her biri günlük pasif gelir ve prestij verir.

| Kategori | Varlıklar |
|---|---|
| Konut | Stüdyo daire, 2+1 daire, Müstakil ev, Villa, Malikâne |
| Araç | Scooter, Hatchback, Sedan, Spor araba, Helikopter |
| Yatırım | Arsa, İş hanı, Marina ve yat, AVM payı |

- Prestij, kafeye gelen müşteriyi artırır (en fazla +%50).
- Araçlar haritadaki yolda dolaşır, helikopter havada uçar.

### Seviye ve yetenekler
- Müşteri ağırlamak, hedefler ve başarımlar deneyim verir.
- Her seviye atlayışında para ve 1 yetenek puanı kazanılır.
- 5 yetenek, her biri 10 seviyeli: Hızlı eller, Güler yüz, Müşteri mıknatısı, Bahşiş ustası, VIP kulübü.

### Hedefler ve başarımlar
- İlk 8 hedef sırayla gelir, sonrasında seviyeye göre otomatik yeni hedefler üretilir.
- 22 başarım (müşteri, seviye, itibar, menü, mekan, varlık, net servet, franchise, gün sayısı). Ödül manuel toplanır.

### Franchise
- Tüm yatırımlar maksimum olunca yeni şehirde şube açılır.
- Sıfırlanır: kafe yatırımları, menü, para, itibar, mekan.
- Kalır: seviye, yetenekler, başarımlar, Dünya'daki varlıklar, kafe adı.
- Her marka yıldızı kalıcı +%25 gelir verir.

### Kafe adı
Kafe sekmesinden 14 karaktere kadar ad girilir, sahnedeki tabelada görünür.

### Çevrimdışı kazanç
Oyunu kapatınca kafe ve yatırımlar (en çok 3 saat, %30 hızla) çalışmaya devam eder. Dönünce toplanır.

## Kayıt

İlerleme tarayıcının `localStorage` alanında `tycoon-v3` anahtarıyla saklanır. Tarayıcı verisini silerseniz kayıt gider. Sıfırdan başlamak için:

```js
localStorage.removeItem('tycoon-v3'); location.reload();
```

## Bulut kaydı ve liderlik tablosu (Supabase)

Oyun, Supabase ile isteğe bağlı bulut kaydı ve liderlik tablosu sunar. Giriş yapılmazsa oyun eskisi gibi yerel kayıtla çalışır. **Sıralama** sekmesinden giriş yapılır.

| Özellik | Nasıl çalışır |
|---|---|
| Giriş | E-posta ile giriş bağlantısı (magic link) veya misafir (anonim) hesap |
| Bulut kaydı | `saves` tablosu, kullanıcı başına tek satır. Her 30 saniyede ve sayfa gizlenince otomatik yazılır |
| Çakışma | Yeni cihaz boşsa bulut kaydı otomatik iner. İki tarafta da farklı ilerleme varsa "Hangi kayıt kalsın?" diye sorar |
| Liderlik | `leaderboard` tablosu, ilk 20: net servet veya müşteri sayısı. Kafe adı ve şehir herkese açıktır, e-posta tabloda hiç yoktur |
| Gizlilik | "Sıralamada göster" kutusu kapatılırsa satır silinir |

### Supabase tabloları
Şema `supabase/migrations/` altındadır (RLS açık):
- `public.saves`: `user_id`, `state` (jsonb), `updated_at`. Kullanıcı yalnızca kendi satırını okur ve yazar.
- `public.leaderboard`: `user_id`, `cafe_name`, `city`, `net_worth`, `customers`, `level`, `updated_at`. Herkes okur, yalnızca sahibi yazar. Ad en çok 14 karakter, değerler sınırlıdır.

Güvenlik kuralları gerçek veritabanında denendi: başkasının satırı yazılamıyor, anonim kullanıcı kayıt okuyamıyor ve liderliğe yazamıyor, sınır dışı değerler reddediliyor.

### Anahtarlar
`index.html` içinde yalnızca **herkese açık** proje URL'si ve publishable anahtar bulunur (`SUPABASE_URL`, `SUPABASE_KEY`). Bu anahtar RLS ile korunur. **Service role anahtarını asla depoya koyma.**

### Supabase panelinde yapılması gerekenler
1. **Authentication → URL Configuration:** Site URL ve Redirect URLs listesine oyunun yayın adresini (ör. Vercel adresi) ekle. Eklenmezse giriş bağlantısı oyuna dönemez.
2. **Authentication → Sign In / Providers:** Misafir girişini kullanmak istiyorsan "Allow anonymous sign-ins" seçeneğini aç. Kapalıysa oyun bunu kullanıcıya bildirir, e-posta ile giriş yine çalışır.
3. **E-posta gönderimi:** Supabase'in yerleşik e-posta servisi saatlik gönderim sınırına sahiptir. Gerçek kullanıcılar için kendi SMTP sağlayıcını (Authentication → SMTP) bağla.
4. Giriş bağlantısı `file://` ile açılan sayfada çalışmaz. Oyunu http(s) adresinden aç.

### Bilinen sınırlamalar
- **Hile:** Liderlik skorları istemciden yazılır, bu yüzden oyunu kurcalayan biri sahte skor gönderebilir. Prototip için kabul edilebilir. Ciddi bir yarışma için skorların sunucuda doğrulanması (Edge Function veya sunucu tarafı hesaplama) gerekir.
- **Kafe adı denetimi yok:** Ad herkese göründüğü için uygunsuz isimler için bir filtre veya raporlama eklenmesi önerilir.
- **Misafir hesabı** tarayıcıya bağlıdır. Çıkış yapılırsa o kayda geri dönülemez. Misafirden e-postaya dönüştürme henüz yok.

## Prototip notları

- Reklam butonları (`Reklam`, `Reklam izle: x2`) **simülasyondur**, gerçek reklam SDK'sı yok.
- Ses yok.
- Grafikler tamamen kodla çizilir (Canvas), harici görsel dosyası yoktur.
- Ekonomi sayıları ilk denemedir, oynanış testine göre ayarlanmalıdır.

## Dosya yapısı

```
kafetycoon/
├── index.html                 # Oyunun tamamı (HTML + CSS + JavaScript)
├── README.md                  # Bu dosya
└── supabase/
    └── migrations/            # Veritabanı şeması (tablolar, RLS, tetikleyiciler)
```

## Kodda ayar yapmak için

Sayıları `index.html` içindeki `<script>` bölümünde bulabilirsin:

| Ne | Nerede |
|---|---|
| Ürünler ve fiyatları | `PRODUCTS` |
| Varlıklar (fiyat, gelir, prestij, seviye) | `ASSETS` |
| Mekanlar ve masa sayıları | `ROOMS` |
| Masa fiyatları ve seviye şartları | `TAB_COST`, `TAB_REQ` |
| Başarımlar | `ACH` |
| Yetenekler | `PERKS` |
| Günlük olaylar | `EVENTS` |
| Gün süresi | `DAY_LEN` |
| Talep eğrisi | `demandOf()` |

## Yol haritası

- [ ] Ses efektleri ve müzik
- [ ] Dünya'da varlık satma ve yükseltme (ev döşeme, araç modifiye)
- [ ] Rastgele olaylar (vergi, kriz, fırsat teklifi)
- [ ] Birden fazla şehirdeki şubeleri aynı anda yönetme
- [ ] Gerçek reklam entegrasyonu (Unity'ye ya da uygulama sarmalayıcıya taşındığında)
- [ ] Gerçek sprite ve görseller (SpriteCook, CellCog gibi bir eklentiyle)
