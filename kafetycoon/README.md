# Köşe Kafe Tycoon

Tarayıcıda oynanan, mobil öncelikli bir kafe tycoon oyunu. Müşterileri ağırla, kafeni büyüt, kazandığın parayı şehirde harca. Oyun yüklenebilir uygulama (PWA) olarak da çalışır.

Derleme veya kurulum gerektirmez: `index.html` ve yanındaki dosyalar yeterlidir.

## Çalıştırma

- **Yerelde:**
  ```bash
  cd kafetycoon
  python3 -m http.server 8000
  ```
  Sonra tarayıcıda `http://localhost:8000` adresini aç.
- **Yayın:** Klasörü olduğu gibi bir statik sunucuya koyabilirsin (Vercel için Root Directory: `kafetycoon`).
- `index.html` dosyasına çift tıklayarak da açılır, ama **3B görünüm, e-posta girişi ve çevrimdışı önbellek `file://` ile çalışmaz.** Bunlar için http(s) gerekir.

## Arayüz teması
Arayüz parlak, kalın ve oyuncak tarzında: üstte hap biçimli göstergeler (para, itibar, seviye), altta renkli kalın ikon düğmeleri, açık renkli kartlar ve pencereler. Düğmeler basınca aşağı çöker. İptal edilebilen pencerelerde sağ üstte kırmızı çarpı çıkar. Sahnenin altındaki mavi **Hızlan x2** düğmesi (Dünya haritası dışında) 30 saniyelik hız artışını başlatır. Zemin gökyüzü mavisi. Her sekme kendi renginde çerçeveli bir paneldir (`#p-...` kuralları, `--pf` çerçeve, `--pd` koyu kenar, `--pi` iç zemin). Düğme renkleri `--c1`, `--c2`, `--bd` değişkenleriyle verilir. Pencerelerde renkli başlık bandı vardır, renk içeriğe göre seçilir (gün sonu turuncu, denetim kırmızı vb.). Menü, yönetici ve kariyer listeleri iki sütunlu kart ızgarasıdır. Sahnenin sağındaki kısayol sütunu çark, sandık ve etkinliğe götürür, hazır olanlarda kırmızı nokta yanar. Yeni hafta başlayınca etkinlik penceresi çıkar. Renkler ve kalınlık `:root` içindeki değişkenlerle ayarlanır. Yazı tipi Fredoka (Google Fonts), yüklenemezse sistemin yuvarlak yazı tipi kullanılır.

## Ekranlar

Altta 5 ana sekme vardır. Her birinin altında alt sekmeler bulunur. Sahne ile panel arasındaki tutamaçla paneli büyütüp sahneyi küçültebilirsin. Kırmızı noktalar yapılabilecek bir şey olduğunu gösterir.

| Ana sekme | Alt sekmeler |
|---|---|
| **Kafe** | Bugün (gelir, müşteri, hedef, unvan, zaman hızı) |
| **Büyüt** | Yatırım, Menü, Fiyat, Yönetici |
| **Dünya** | Varlıklar, Kariyer, Hayır, Şehirler |
| **Ödüller** | Çark, Sandık, Etkinlik, Başarım |
| **Ben** | Karakter, Yetenek, Sıralama, Ayarlar, Kafe |

## Oyun döngüsü

```
Müşteri gelir → kuyruğa girer → barista sipariş hazırlar → masaya oturur → bahşiş bırakır
        ↓
   Para kazanılır → menüye, mekana, yöneticilere harcanır → seviye atlanır → sandık ve kart düşer
        ↓
   Fazla para Dünya'da varlığa, işe ve hayra yatırılır → pasif gelir + prestij → kafeye daha çok müşteri
        ↓
   Her şey maksimuma gelince franchise: yeni şehirde başla, eski şuben otomatik çalışmaya devam eder
```

### Gün sonu
Gün bitince giderler **bir kez** kesilir: kira ve bakım (kafe büyüklüğü + pasif gelirin %3'ü) ve malzeme (kafe gelirinin %10'u). Para yetmezse itibar -0.1 düşer. Ardından 15 saniyelik karar ekranı açılır:
- **Kampanya:** gelirin %20'si gider, ertesi gün müşteri x1.25.
- **Personele prim:** gelirin %12'si gider, ertesi gün hizmet %10 hızlanır, itibar +0.1.
- **Maliyet kıs:** günün giderinin yarısı iade edilir, itibar -0.1.
- **Standart gün:** değişiklik yok. Süre dolarsa bu seçilir, oyun takılı kalmaz.

Gider durumu kayda (`dayDone`, `endRep`) yazılır, bu yüzden sayfayı yenilemek gideri ikinci kez kesmez.

### Marka ve itibar
İtibar (1-5) müşteri çekimini `0.45 + 0.25 x itibar` ile çarpar ve pasif geliri `1 + 0.1 x (itibar - 3)` ile çarpar. Gün sonunda `(itibar - 2)^2 x (1 + seviye/10)` kadar **Marka Değeri** kazanılır. Dünya > Marka sekmesinde harcanır:
- **Basın kampanyası:** 8 marka + yarım günlük gelir, itibar +0.25, günde bir kez.
- **Marka sözleşmesi** (5 seviye, 10/40/90/160/250 marka): müşteri +%5 ve itibar tabanı +0.2. Marka Değeri ve sözleşmeler franchise'da kalır.

## Sistemler

### Kafe (sahne)
- Yukarıdan görünen kafede müşteriler yürür, kuyruğa girer, oturur ve çıkar. Kuyruk dolarsa müşteri gelmeden gider, beklemekten sıkılan müşteri itibar düşürür. Masa yoksa paket alıp çıkar.
- Her gün 90 saniye sürer, ortasında yoğun saat vardır. Gün içinde ışık değişir (sabah sıcak, akşam karanlık).
- Günlük olaylar: Normal gün, Yağmurlu gün (yağmur yağar), Hafta sonu, Festival (bayraklar asılır), Öğrenci haftası.
- VIP müşteriler 2,5 kat öder ama sabırsızdır, bazen sandık düşürür.
- Sahnede kafe sahibi (senin karakterin) tezgahın yanında durur.

### Büyüt
- **Yatırım:** Masa (15'e kadar), Mekan genişletme (4 mekan: Köşe kafe 6 masa → Geniş salon 9 → Teras katı 12 → Büyük kafe 15), Barista (3), Espresso makinesi (7), Pasta vitrini (4), Dekor (6). Gelişmiş yatırımlar oyuncu seviyesi ister.
- **Menü:** 5 içecek ve 5 yiyecek. Yiyecekler için vitrin gerekir. Menü çeşitlendikçe müşteri artar.
- **Fiyat:** Her ürünün fiyatı ayarlanır (adil fiyatın %50'si ile %300'ü). Ucuz satmak müşteriyi artırır, pahalı satmak azaltır ve çok pahalıda itibar düşer. Servis kapasitesi doluysa fiyat artırmak kazancı yükseltir.
- **Yönetici:** 6 yönetici (Baristabaşı, Salon müdürü, Muhasebeci, Pazarlamacı, Şef, Denetim uzmanı). Kart toplanır, her biri 10 seviyeye kadar yükselir. Kartlar sandıktan, çarktan ve kart paketinden (para karşılığı) gelir.

### Dünya
- **Varlıklar:** 14 varlık (konut, araç, yatırım). Her biri günlük pasif gelir ve prestij verir. **Haritadaki her yere dokunarak** yönetim penceresini açabilirsin (2B ve 3B). Varlıklar 5 seviyeye yükselir (Konut: döşeme, Araç: modifiye, Yatırım: yenileme), seviye geliri ve prestiji artırır. İstersen değerinin yarısına satabilirsin. Haritada seviye kadar yıldız görünür.
- **Kariyer:** 4 yan iş (Toptan kahve, Online sipariş, Catering, Kahve markası), 10 seviyeye kadar, günlük pasif gelir.
- **Hayır:** Bağış yaptıkça hayırsever kademe yükselir, her kademe müşteriyi %2 artırır.
- **Şehirler:** Franchise açınca eski şuben otomatik yönetilen bir şube olarak kalır, günlük pasif gelir getirir ve yükseltilebilir.
- Prestij, kafene gelen müşteriyi artırır (en fazla +%50).

### Ödüller
- **Çark:** Günde bir ücretsiz çevirme (para, kart, hız, deneyim, sandık). Reklamla günde 3 ek çevirme.
- **Sandık:** Bronz, gümüş ve altın. VIP müşteri, seviye atlama, başarım ve denetimden düşer. İçinden para, yönetici kartı, deneyim ve bazen hız çıkar.
- **Etkinlik:** Haftalık etkinlik herkes için aynıdır (Kahve haftası, Tatlı festivali, Yoğun hafta, Cömert müşteriler, VIP haftası) ve gelire etki eder. Haftalık müşteri hedefine ulaşınca para, deneyim ve altın sandık verir.
- **Başarım:** 22 başarım, ödül manuel toplanır.

### Ben
- **Karakter:** Ten, saç, gömlek, şapka ve aksesuar özelleştirme. Bazı parçalar paralıdır. Seviyeye göre unvan (Çırak → Kahve baronu). Karakter 2B ve 3B sahnede görünür.
- **Yetenek:** Seviye atlayınca puan kazanılır, 5 yetenek 10 seviyeye kadar.
- **Sıralama:** Hesap ve liderlik tablosu (aşağıya bak).
- **Ayarlar:** Ses, müzik, titreşim, bildirim, anonim ölçüm, premium (simülasyon).
- **Kafe:** Kafe adı (tabelada görünür), şube bilgisi ve **franchise**: tüm yatırımlar maksimum olunca yeni şehirde yeniden başlarsın. Seviye, yetenek, başarım, varlıklar, karakter ve kafe adın kalır. Her marka yıldızı kalıcı +%25 gelir verir.

### Denetim olayı
Bazı günlerde belediye denetimi gelir. "Denetime gir" ya da "Ertele" diye seçersin. Başarı şansı itibar, dekor, barista sayısı ve Denetim uzmanına bağlıdır, pencerede açıkça yazar. Geçersen para ve bazen sandık, geçemezsen ceza ve küçük itibar kaybı vardır.

### Ses, titreşim ve efektler
Ses efektleri ve hafif müzik koddan üretilir (dosya yok). Titreşim yalnızca telefonda ve dokunduktan sonra çalışır. Parçacık efektleri, akıcı para sayacı, yağmur ve gün içi ışık vardır. Hepsi Ayarlar'dan kapatılabilir.

### Çevrimdışı kazanç
Oyunu kapatınca kafe ve yatırımlar (en çok 3 saat, %30 hızla) çalışmaya devam eder. Dönünce toplanır.

## 3B görünüm (Three.js)

Sahne sağ üstteki **3B** düğmesiyle 3B'ye geçer. Kafe sekmelerinde 3B kafe, Dünya sekmesinde 3B şehir görünür.

- 3B görünüm yalnızca düğmeye basınca yüklenir, kapatınca kaynaklar temizlenir. 3B kod oyunu değiştirmez, yalnızca okur.
- **Ayrı demo:** `3d-demo.html` sayfasında sahneyi serbestçe döndürüp yakınlaştırabilirsin.
- WebGL desteklenmeyen cihazda düğme "3B açılamadı" der ve oyun 2B devam eder.

**Güvenlik:** Three.js CDN'den değil, depodaki sabit sürümden (`vendor/three`, 0.170.0) yüklenir. Paketin bütünlüğü npm kaydıyla doğrulanmış, dosya özetleri `vendor/VENDOR.md` içinde. Dışarıdan model, doku veya betik çekilmez. Projeye özel kurallar `.claude/skills/threejs/SKILL.md` içindedir.

### Model kiti
Kafe 3B görünümünde mobilya ve mutfak, KayKit Restaurant Bits (CC0, Kay Lousberg) modelleriyle çizilir: masa, sandalye, tezgâh, lavabo, ocak, fırın, buzdolabı, tabak, tencere. Modeller `assets/kaykit-restaurant/` içindedir (yaklaşık 760 KB, tek doku). Mutfak hattı makine ve vitrin seviyesine göre büyür. Modeller yüklenemezse kafe eski kodla üretilen şekillerle çizilir. Kaynak ve özetler için `assets/kaykit-restaurant/SOURCE.md`.

## Hesap, bulut kaydı ve sıralama (Supabase)

| Özellik | Nasıl çalışır |
|---|---|
| Giriş | E-posta ile giriş bağlantısı (magic link), **Google ile giriş**, **Apple ile giriş** veya misafir (anonim) hesap. Google ve Apple düğmeleri yalnızca Supabase'de o sağlayıcı açıksa görünür |
| Bulut kaydı | `saves` tablosu, kullanıcı başına tek satır. Her 30 saniyede ve sayfa gizlenince yazılır |
| Çakışma | Yeni cihaz boşsa bulut kaydı iner. İki tarafta da farklı ilerleme varsa "Hangi kayıt kalsın?" diye sorar |
| Liderlik | `leaderboard`: net servet ve müşteri sayısı, ilk 20 |
| Haftalık sıralama | `season_scores`: o haftaki kafe geliri, ilk 20 |
| Gizlilik | Kafe adı ve şehir herkese açıktır, e-posta tabloda yoktur. "Sıralamada göster" kapatılırsa satırlar silinir |
| **Misafirler** | Bulut kaydı saklayabilir ama **sıralamalara yazamaz** (veritabanı kuralı) |

### Tablolar ve güvenlik
Şema `supabase/migrations/` altındadır, tüm tablolarda RLS açıktır:
- `saves`: yalnızca sahibi okur ve yazar.
- `leaderboard`, `season_scores`: herkes okur, yalnızca e-postayla giriş yapmış sahibi yazar. Ad en çok 14 karakter, değerler sınırlıdır.
- `app_events`: anonim ölçüm. İstemci yalnızca ekleyebilir, **kimse okuyamaz** (yalnızca proje sahibi panelden/SQL ile).

Güvenlik kuralları gerçek veritabanında denendi: başkasının satırı yazılamıyor, misafir sıralamaya yazamıyor, anonim kullanıcı kayıt ve ölçüm okuyamıyor, sınır dışı değerler reddediliyor.

`index.html` içinde yalnızca **herkese açık** proje URL'si ve publishable anahtar bulunur. **Service role anahtarını asla depoya koyma.**

### Supabase panelinde yapılması gerekenler
1. **Authentication → URL Configuration:** Site URL ve Redirect URLs listesine oyunun yayın adresini ekle.
2. **Authentication → Sign In / Providers:** Misafir girişi için "Allow anonymous sign-ins" seçeneğini aç.
3. **E-posta:** Yerleşik e-posta servisi saatlik gönderimle sınırlıdır. Gerçek kullanıcılar için kendi SMTP sağlayıcını bağla (Authentication → SMTP).
4. **Google ile giriş (ücretsiz, SMTP gerektirmez):**
   - Google Cloud Console → APIs & Services → OAuth consent screen'i yapılandır, sonra Credentials → Create credentials → OAuth client ID → "Web application".
   - Authorized redirect URI olarak `https://<proje-kodu>.supabase.co/auth/v1/callback` adresini ekle (bu projede `https://jsweeupxworydfpihlgd.supabase.co/auth/v1/callback`).
   - Üretilen Client ID ve Client secret değerlerini Supabase'de Authentication → Sign In / Providers → Google bölümüne gir ve etkinleştir.
5. **Apple ile giriş (ücretli Apple Developer hesabı gerekir, yılda 99 $):** Apple Developer'da bir Services ID ve Sign in with Apple anahtarı (.p8) oluşturup Supabase'de Authentication → Sign In / Providers → Apple bölümüne gir. Apple'ın istemci gizli anahtarı (JWT) en çok 6 ay geçerlidir, süresi dolmadan yenilenmelidir. Oyun native iOS uygulamasına sarılırsa, başka üçüncü taraf girişler sunulduğunda Apple ile girişi de sunmak App Store kuralıdır.

Sağlayıcıyı açtıktan sonra oyunda kod değişikliği gerekmez: **Ben > Sıralama** ekranında ilgili düğme kendiliğinden görünür.

### Bilinen sınırlamalar
- **Hile:** Skorlar istemciden yazıldığı için oyunu kurcalayan biri sahte skor gönderebilir. Ciddi bir yarışma için skorların sunucuda doğrulanması gerekir.
- **Kafe adı denetimi yok:** Ad herkese göründüğü için uygunsuz isimlere karşı filtre önerilir.
- **Misafir hesabı** tarayıcıya bağlıdır. Çıkış yapılırsa o kayda geri dönülemez, e-postaya dönüştürme yoktur.

## Anonim ölçüm

Oyun, geliştirmek için kimlik içermeyen kullanım olaylarını `app_events` tablosuna gönderir: `session_start`, `tab_view`, `purchase`, `level_up`, `day_end`, `chest_open`, `wheel_spin`, `audit`, `franchise`, `ad_sim`, `premium`, `error`. Ad, e-posta ve kayıt içeriği gönderilmez. Her cihaz rastgele bir `anon_id` kullanır.

- İlk açılışta kısa bir bildirim gösterilir, **Ben > Ayarlar > Gizlilik** bölümünden kapatılabilir. Kapalıyken hiçbir olay gönderilmez.
- Okuma yalnızca proje sahibine açıktır. Örnek sorgular:

```sql
-- Oyuncular hangi günde bırakıyor? (her cihaz için ulaşılan en son gün)
select max_day, count(*) from (
  select anon_id, max((props->>'day')::int) as max_day from app_events where name = 'day_end' group by anon_id
) t group by max_day order by max_day;

-- En çok hangi sekmeler açılıyor?
select props->>'t' as sekme, count(*) from app_events where name = 'tab_view' group by 1 order by 2 desc;

-- Reklam yerleşimleri
select props->>'p' as yer, count(*) from app_events where name = 'ad_sim' group by 1 order by 2 desc;
```

## Para kazanma (simülasyon)

Reklam ve ödeme **gerçek değildir**, prototip içindir:
- Reklam butonları (zaman hızı, çevrimdışı kazancı katlama, sandık ödülünü katlama, çark ek çevirme) 3 saniyelik bir "reklam simülasyonu" gösterir.
- **Premium (simülasyon):** Açıkken reklam beklemesi atlanır ve kafe geliri %25 artar. Gerçek ödeme yoktur.

## PWA ve bildirimler

- `manifest.webmanifest`, `sw.js` ve simgeler sayesinde oyun ana ekrana eklenebilir ve çevrimdışı açılabilir. Sayfa istekleri önce ağdan denenir, çevrimdışıysa önbellekten gelir. **Yeni sürümde `sw.js` içindeki `CACHE` adını artır.**
- **Bildirimler (isteğe bağlı):** Tarayıcı arka plandayken, çark ve sandıklar hazırsa günde en çok bir hatırlatma gösterilir. **Uygulama tamamen kapalıyken bildirim gelmez.** Bunun için sunucudan push bildirimi gerekir (VAPID anahtarı, abonelik tablosu, zamanlanmış bir Edge Function). E-posta hatırlatması da bir e-posta sağlayıcısı gerektirir. İkisi de henüz kurulmadı.

## Prototip notları

- Ekonomi sayıları ilk denemedir, oynanış testine göre ayarlanmalıdır.
- Grafikler tamamen kodla çizilir (Canvas ve Three.js), harici görsel dosyası yoktur.

## Dosya yapısı

```
kafetycoon/
├── index.html                 # Oyunun tamamı (HTML + CSS + JavaScript)
├── three-view.js              # 3B kafe ve şehir görünümü (Three.js modülü)
├── 3d-demo.html               # Serbestçe gezilebilen ayrı 3B demo
├── manifest.webmanifest       # PWA bildirimi
├── sw.js                      # Servis çalışanı (çevrimdışı önbellek, bildirim tıklaması)
├── icon.svg, icon-192.png, icon-512.png
├── README.md                  # Bu dosya
├── vendor/
│   ├── VENDOR.md              # Three.js sürümü, bütünlük ve özet değerleri
│   └── three/                 # Three.js 0.170.0 (MIT), hiç değiştirilmeden
└── supabase/
    └── migrations/            # Veritabanı şeması (tablolar, RLS, tetikleyiciler)

../.claude/skills/threejs/     # Projeye özel Three.js kuralları (skill)
```

## Kodda ayar yapmak için

Sayıları `index.html` içindeki `<script>` bölümünde bulabilirsin:

| Ne | Nerede |
|---|---|
| Ürünler ve fiyatları | `PRODUCTS` |
| Varlıklar (fiyat, gelir, prestij, seviye) | `ASSETS`, seviye çarpanı `aMult()` |
| Kariyer işleri | `BIZ` |
| Yöneticiler ve kart ihtiyacı | `MGRS`, `MGR_NEED` |
| Çark dilimleri | `WHEEL` |
| Sandık içerikleri | `CHEST` |
| Mekanlar ve masa sayıları | `ROOMS` |
| Haftalık etkinlikler | `W_EVENTS` |
| Başarımlar | `ACH` |
| Karakter parçaları ve fiyatları | `AV` |
| Yetenekler | `PERKS` |
| Günlük olaylar | `EVENTS` |
| Gün süresi | `DAY_LEN` |
| Talep eğrisi | `demandOf()` |

## Yol haritası

- [ ] Gerçek push bildirimi (VAPID + Supabase Edge Function + zamanlama) ve e-posta hatırlatması
- [ ] Skorların sunucuda doğrulanması (hile önleme)
- [ ] Kafe adı filtresi / raporlama
- [ ] Gerçek reklam ve ödeme entegrasyonu (uygulama sarmalayıcıya taşındığında)
- [ ] Gerçek sprite ve görseller
- [ ] Misafir hesabını e-postaya dönüştürme
