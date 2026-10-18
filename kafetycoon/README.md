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

## Alım kartları ve gelir göstergesi
Üstteki para göstergesinin yanında tahmini gelir (`+₺1.5/sn`, kafe + pasif gelir) görünür. Alım kartlarında (Kafe > Yükselt, Menü, Servet > İşletmeler) parası yetmeyen düğmenin altında **"₺X eksik"** yazar ve açıklamanın altında bir ilerleme çubuğu çıkar. Oyunun şimdi önerdiği alım (`pickBuy()`) **Önerilen** rozetiyle sarı çerçeveli işaretlenir: hedefle ilgili alınabilir olan, yoksa parası yeten en ucuz, yoksa biriktirilecek en ucuz. Liste sırası değişmez, böylece dokunurken kartlar kaymaz.

## Okunabilirlik
- **Yazı boyutu:** Ben > Ayarlar > Yazı boyutu (Normal, Büyük x1.12, Çok büyük x1.25). Tüm yazılar `--fs` çarpanıyla ölçeklenir (`calc(14px * var(--fs))`). En küçük yazı 14 px'tir (yalnızca büyük harfli "Sıradaki adım" etiketi ve "Önerilen" rozeti 12 px). En büyük boyutta üstteki gelir yazısı gizlenir, alt gezinme etiketleri büyümez.
- **Kontrast:** parlak düğmelerde (turuncu, yeşil, mavi, pembe, mor, sarı) koyu kahverengi yazı kullanılır; beyaz yazı bu renklerde yeterli kontrast vermiyordu. Koyu yazı oranları 5:1 ile 12:1 arasındadır. Kullanılamayan düğme gri zeminde koyu gri yazıdır. Vurgu rengi (`--copper`) 5.4:1 kontrast verecek şekilde koyulaştırıldı.
- **Şehirdeki etiketler** dünya boyutunda sabit piksel ölçeğiyle (`PX`) çizilir; metne göre genişler, telefonda yaklaşık 15 px okunur.
- Hareket azaltma tercihi (`prefers-reduced-motion`) açıksa nabız ve parmak animasyonları durur.

## Mini oyun: Burger Dizme
Ödüller > **Oyun** sekmesinden ya da sağdaki kısayol sütunundaki oyun düğmesinden açılır. Siparişte 2-6 malzeme sırası yazar (köfte, peynir, marul, domates, soğan, turşu). Malzemelere sırayla dokunarak burgeri dizersin, 30 saniye sürer. Doğru sıra puan verir (`10 + 4 x malzeme sayısı`, seri çarpanı en çok x3), yanlış malzeme seriyi sıfırlar ve 1.5 sn kaybettirir. Sipariş uzunluğu her 2 burgerde bir artar.
- **Ödül:** `rewardBase() x (0.3 + min(2.7, puan/60))` kadar para ve 8 deneyim. Günde ilk **3 oyun ödüllü**; sonrası antrenmandır. Sonuç ekranında **Reklamla x2** (simülasyon) ödülü ikiye katlar.
- Oyun açıkken kafenin günü ve denetimler durur (`mgOpen`). En iyi skor kayıtta (`S.mg.best`). Ödüllü hak varken Ödüller sekmesinde ve rail'de kırmızı nokta yanar, "Sıradaki adım" boş zamanda oyunu önerir.

## Rakip firmalar ve pazar payı
Üç yapay zekâ rakip vardır: **Ucuz Kafe** (düşük fiyat), **Premium Kahve** (pahalı, kaliteli, itibarlı) ve **Zincir Kahve** (her gün büyür, ara sıra %15 kampanya yapar). Hepsi yerel bir kural motoruyla çalışır, gerçek oyuncu değildir.
- **Pazar payı:** her firmanın çekiciliği `kalite^0.8 x itibar^0.9 x (1/fiyat)^1.5` ile hesaplanır, pay toplam içindeki orandır. Senin fiyatın `avgMult()`, kaliten `qDrink()`, itibarın `S.rep` değeridir. Rakiplerin kalitesi gün sayısına göre büyür (`rivalQ`), yani yatırım yapmazsan geride kalırsın.
- **Etki:** `marketMult() = 1 + 1.2 x (pay - 0.25)`, en az 0.7, en çok 1.35. Pay %25 ise etki yoktur. Müşteri akışına (`popularity()`) çarpan olarak girer. Fiyatı veya kaliteyi değiştirince hemen etkisini görürsün.
- **Gün sonu:** rakipler karşılık verir. Payın %38'i geçerse fiyat düşürürler, %15'in altındaysa fiyat artırırlar. Haberler Pazar sekmesinde ve gün sonu raporunda "Pazar payı" satırı (▲/▼) görünür.
- **Ekranlar:** Kafe > Pazar (paylar, rakip kartları, tavsiye, haberler). Şehir haritasının köşelerinde rakip binaları pazar payı etiketiyle durur, dokununca Pazar sekmesi açılır. Franchise açınca gün sayacı sıfırlandığı için pazar da yeniden başlar.
- Rakamlar tahmindir; `RIVALS` ve `attract()` ile ayarlanır.

## Sahne yalnızca nerede gerekiyorsa var
Şehir, işletme içi ve Kafe sekmelerinde üstte sahne görünür. **Servet, Ödüller ve Ben** sekmelerinde sahne yoktur, liste ekranın tamamını kaplar (`body.noscene`). Bu sekmelerde çizim de yapılmaz, pil tasarrufu sağlar. Servet'teki mülkler Şehir ana ekranında görünür.

## Gezinme adları
Alt çubuk: **Şehir** (harita), **Kafe** (yükselt, menü, fiyat, personel), **Servet** (mülkler, işletmeler, hayır, marka, şubeler), **Ödüller** (çark, sandık, etkinlik, başarım), **Ben** (karakter, yetenek, sıralama, ayarlar, kafem). Kafedeki yardımcılar **personel** (kartla yükselir), şehirdeki işletmelerin yöneticisi **müdür** diye anılır.

## Rehber ve "Sıradaki adım"
- **İlk açılış rehberi:** yeni oyuncuya 6 adımda yol gösterir: kafeye gir, nasıl çalıştığını gör, Büyüt'e git, ilk yükseltmeyi al, Şehir'e dön, "Sıradaki adım"ı tanı. Hedefi vurgular ve parmak işaretiyle gösterir. Yumuşak bir rehberdir: dokunmalar engellenmez, "Atla" ile kapatılır. Bitirince +₺50 verilir. İlerleme kayıtta `tut` alanında tutulur (99 = bitti). Eski oyuncular (seviye 1'den ileride) rehberi görmez.
- **Sıradaki adım çubuğu** (Şehir ve kafe ekranlarının üstünde): şimdi yapılacak en mantıklı şeyi yazar ve dokununca doğru ekrana götürür. Öncelik: haftalık ödül, sandık, günlük çark, hedefle ilgili alım, parası yeten en ucuz alım (yükseltme, menü ürünü, işletme kurma), yoksa "₺X biriktir" ve tahmini süre. Alım için götürdüğü düğme kısa süre atlayıp vurgulanır. Mantık `nextStep()` içindedir.

## Arayüz teması
Arayüz parlak, kalın ve oyuncak tarzında: üstte hap biçimli göstergeler (para, itibar, seviye), altta renkli kalın ikon düğmeleri, açık renkli kartlar ve pencereler. Düğmeler basınca aşağı çöker. İptal edilebilen pencerelerde sağ üstte kırmızı çarpı çıkar. Sahnenin altındaki mavi **Hızlan x2** düğmesi (Servet'teki eski harita dışında) 30 saniyelik hız artışını başlatır. Zemin gökyüzü mavisi. Her sekme kendi renginde çerçeveli bir paneldir (`#p-...` kuralları, `--pf` çerçeve, `--pd` koyu kenar, `--pi` iç zemin). Düğme renkleri `--c1`, `--c2`, `--bd` değişkenleriyle verilir. Pencerelerde renkli başlık bandı vardır, renk içeriğe göre seçilir (gün sonu turuncu, denetim kırmızı vb.). Menü, personel ve işletme listeleri iki sütunlu kart ızgarasıdır. Yeni hafta başlayınca etkinlik penceresi çıkar. Renkler ve kalınlık `:root` içindeki değişkenlerle ayarlanır. Yazı tipi Fredoka (Google Fonts), yüklenemezse sistemin yuvarlak yazı tipi kullanılır.

## Şehir ana ekranı
Oyun artık izometrik bir şehir haritasıyla açılır (`three-hub.js`, Three.js, ortografik kamera). Harita 7x7 karelik bir adadır: parmakla kaydırılır, iki parmakla yakınlaştırılır. Binalar işletmelerdir: Köşe Kafe, Toptan kahve, Burger Dükkânı, Online sipariş, Tatlıcı, Catering, Restoran, Kahve markası (seviye 3, 4, 6, 8, 10, 12, 15'te açılır). Seviyesi yetmeyenler gri ve kilitli görünür.
- **Kafe binası:** dokununca kafenin içine girersin (müşteri, fiyat, menü, gün sonu kararı aynen çalışır). Üstteki **‹ Şehir** düğmesi veya alttaki Şehir sekmesi haritaya döndürür. Sen şehirdeyken kafe arka planda çalışmaya devam eder.
- **Diğer işletmeler:** dokununca kart açılır (seviye, günlük gelir, kur/yükselt, müdür). Bu işletmeler Servet > İşletmeler ile aynı sistemdir. Seviye 4 ve 8'de işletmenin geliri x2 olur. **Müdür** (kurulum maliyetinin 6 katı) geliri %50 artırır ve para balonlarını kendisi toplar. Müdürü olan işletmenin etiketinde ★ görünür. Gelir her işletme için `inc x seviye x kilometre taşı x müdür` günlük, çevrimdışı kazanca da dahildir.
- **İç mekân (`three-biz.js`):** kurulu bir işletmeye dokununca içine girilir (kafe gibi). Burger, Tatlıcı ve Restoran'da müşteriler kapıdan girip masaya oturur, çalışanlar mutfakta çalışır. Toptan, Online sipariş, Catering ve Kahve markası'nda çalışanlar ve koliler görünür. Seviye arttıkça masa sayısı, mutfak ekipmanı, koli ve çalışan artar. Müdür varsa ortada yıldızlı bir müdür de görünür. Üzerindeki yeşil "+₺" yazıları görseldir; değerleri işletmenin gerçek saniyelik gelirinden türetilir. Yükselt ve Müdür tut düğmeleri içeride de vardır. Henüz kurulmamış işletmeye dokununca kart açılır, Kur'a basınca içeri girilir.
- **Para balonları:** kurulu her işletmenin üstünde yaklaşık her 30 oyun saniyesinde bir yeşil balon çıkar. Dokununca ya da alttaki **Topla** düğmesiyle toplanır. Değeri o süredeki gelirin %25'idir (ek bonus). Balonlar kaydedilmez.
- **Kısayollar:** sağdaki küçük düğmeler: Topla (para balonları), Çark, Sandık, Etkinlik, Elite (premium simülasyonu). Hazır olanlarda kırmızı nokta yanar. Altta yalnızca gezinme çubuğu vardır; ortada küçük bir **Hızlan x2** düğmesi durur.
- Modeller `assets/kaykit-city/` içindedir (KayKit City Builder Bits, CC0, yaklaşık 1.8 MB disk, tek doku). Kaynak ve özetler `SOURCE.md` ve `SHA256SUMS` dosyalarında. WebGL yoksa veya modeller yüklenemezse oyun kafe görünümüne düşer.
- Ekran 3B çizimi pil için en çok yaklaşık 30 kare/sn ile sınırlıdır.

## Ekranlar

Altta 5 ana sekme vardır. Her birinin altında alt sekmeler bulunur. Sahne ile panel arasındaki tutamaçla paneli büyütüp sahneyi küçültebilirsin. Kırmızı noktalar yapılabilecek bir şey olduğunu gösterir.

| Ana sekme | Alt sekmeler |
|---|---|
| **Kafe** | Bugün (gelir, müşteri, hedef, unvan, zaman hızı) |
| **Kafe** | Yükselt, Menü, Fiyat, Personel |
| **Servet** | Mülkler, İşletmeler, Hayır, Marka, Şubeler |
| **Ödüller** | Çark, Sandık, Etkinlik, Başarım |
| **Ben** | Karakter, Yetenek, Sıralama, Ayarlar, Kafe |

## Oyun döngüsü

```
Müşteri gelir → kuyruğa girer → barista sipariş hazırlar → masaya oturur → bahşiş bırakır
        ↓
   Para kazanılır → menüye, mekana, personele harcanır → seviye atlanır → sandık ve kart düşer
        ↓
   Fazla para Servet'te mülke, işletmeye ve hayra yatırılır → pasif gelir + prestij → kafeye daha çok müşteri
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
- **Personel:** 6 personel (Baristabaşı, Salon müdürü, Muhasebeci, Pazarlamacı, Şef, Denetim uzmanı). Kart toplanır, her biri 10 seviyeye kadar yükselir. Kartlar sandıktan, çarktan ve kart paketinden (para karşılığı) gelir.

### Servet
- **Mülkler:** 14 varlık (konut, araç, yatırım). Her biri günlük pasif gelir ve prestij verir. Sahip olduğun mülkler Şehir ana ekranında görünür: konutlar, ofis ve AVM adadaki parsellerde durur, arsa inşaat kolileriyle, araçlar yollarda dolaşır, helikopter adanın üstünde uçar, yat denizde yüzer. **Şehirdeki bir mülke dokunarak** ya da listeden **Yönet**'e basarak yönetim penceresini açabilirsin. Varlıklar 5 seviyeye yükselir (Konut: döşeme, Araç: modifiye, Yatırım: yenileme), seviye geliri ve prestiji artırır. İstersen değerinin yarısına satabilirsin. Haritada seviye kadar yıldız görünür.
- **İşletmeler:** 7 işletme (Toptan kahve, Burger, Online sipariş, Tatlıcı, Catering, Restoran, Kahve markası), 10 seviyeye kadar, günlük pasif gelir. Şehir ana ekranında da görünürler.
- **Hayır:** Bağış yaptıkça hayırsever kademe yükselir, her kademe müşteriyi %2 artırır.
- **Şehirler:** Franchise açınca eski şuben otomatik yönetilen bir şube olarak kalır, günlük pasif gelir getirir ve yükseltilebilir.
- Prestij, kafene gelen müşteriyi artırır (en fazla +%50).

### Ödüller
- **Çark:** Günde bir ücretsiz çevirme (para, kart, hız, deneyim, sandık). Reklamla günde 3 ek çevirme.
- **Sandık:** Bronz, gümüş ve altın. VIP müşteri, seviye atlama, başarım ve denetimden düşer. İçinden para, personel kartı, deneyim ve bazen hız çıkar.
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

Kafe sekmelerinde sahne sağ üstteki **3B** düğmesiyle 3B kafeye geçer. Şehir ve işletme içleri her zaman 3B'dir (ayrı modüller: `three-hub.js`, `three-biz.js`).

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

## Günlük görevler ve para uçuşu
- Her gün 3 görev (servis, alım, balon, mini oyun, çark havuzundan, günün tarihine göre sabit). Kafe ekranında "Bugün" sekmesinde görünür; hazır olunca "Sıradaki adım" çubuğu da çağırır.
- Giriş serisi: art arda her gün +%10 ödül (en çok +%50). Üç görev de bitince bronz sandık verilir.
- Ödül miktarı `rewardBase()` ile ekonomiye ölçeklenir. Para, ödül alınırken ve balon/çevrimdışı kazançta üst çubuktaki paraya uçar (Hareketi azalt açıksa uçmaz).

## Renk paleti, yedek ve uygulama simgesi
- Renk teması (Ben > Ayarlar): Gökyüzü, Gün batımı, Orman, Şeker. Tema arka plan gradyanını, üst göstergeleri, alt çubuğu ve tarayıcı `theme-color` rengini değiştirir. Bölüm panellerinin renk kodları (mavi, turuncu, pembe, sarı, mor, yeşil) bilinçli olarak sabit kalır. Renkler `:root` ve `html[data-theme]` altındaki değişkenlerdedir.
- Üst gösterge yazıları temaya göre koyu renktir (`--hudtx`, `--hudem`); simge yazıları koyulaştırıldı.
- Kayıt yedeği: "Yedeği kopyala", "Yedekten yükle", "Oyunu sıfırla" (onaylı) ve sürüm etiketi. Yedek kodu base64 JSON'dur.
- Simgeler gökyüzü temasına göre yenilendi; ayrı maskable (tam taşan) simge ve `apple-touch-icon.png` eklendi.
- Çevrimdışı: şehir ve işletme içi modülleri de önbelleğe alınır.
- Küçük ekran (320px) ve en büyük yazı boyutunda taşan menü/personel kartları ve segment düğmeleri düzeltildi.

## Performans ve kalite
- 3B tuvaller artık çözünürlüğü bir kez uygular (önceden cihaz piksel oranı iki kez çarpılıyor, retina telefonda 4x piksel çiziliyordu). Şehir, işletme içi ve 3B kafe için geçerli.
- Ayarlar > Grafik kalitesi: Otomatik (şehirde ~2 sn ölçüm, yavaşsa çözünürlüğü düşürür), Düşük, Yüksek.
- Şehir açılırken yükleme yüzdesi gösterilir.

## Kafe ekranı (sahnesiz)
Kafeye girince üstteki 2B/3B sahne kapalıdır; alt düğmeler ve listeler tüm alanı kullanır. Hızlan düğmesi ve hızlı düğmeler (mini oyun, çark, sandık, etkinlik) ince bir şerit olarak üstte durur. 3B kafe görünümü kodda duruyor ama arayüzden açılmıyor.

## Şehir ekranı etkileşimi
- Sahip olunan işletmeye dokununca altta bir sayfa açılır: seviye, günlük gelir, hızlı "Yükselt", "Müdür" ve "İçeri gir". Yükseltmek için içeri girmek gerekmez.
- Balon zinciri: balonları 3,5 sn içinde art arda toplarsan her biri +%10 ek kazandırır (en çok +%50). "Hepsini topla" düğmesi zincir saymaz.
- Gece/gündüz: şehrin ışığı kafedeki gün saatine göre akşam ve geceye doğru kararır, şafakta açılır.

## Alım hissi
- Yükselt sekmesinde ×1 / ×5 / Maks alım seçici (parası yettiği kadar seviye alır, seçim kaydedilir).
- Alım düğmesine ya da işletme "Yükselt" düğmesine basılı tutunca alım hızla tekrarlanır.
- Şehir açılırken "Şehir yükleniyor…" mesajı görünür.

## Sade kafe ekranı
- Sağdaki hızlı düğmeler kademeli açılır: çark baştan, mini oyun seviye 2, etkinlik seviye 3, sandık ilk sandıkta ya da seviye 5'te.
- Mülkler listesi kategorilere ayrılmış açılır başlıklardır. İlk kategori ve sahip olunanlar açık gelir.

## Erişilebilirlik ve arayüz denetimi
Web Interface Guidelines ile denetlendi:
- Pinch zoom geri açıldı (`maximum-scale` kaldırıldı; çift dokunma zoom'u `touch-action: manipulation` ile engelli).
- Atlama bağlantısı, `h1`, `main`, düzgün başlık sırası (h1→h4), `aria-live` durum mesajları.
- Pencereler `role="dialog"`: odak ilk düğmeye gider, Escape kapatır. Aktif sekme `aria-current`.
- Şehir haritası klavyeyle gezilir (oklar, +/-) ve gizli işletme listesi vardır.
- "Hareketi azalt" ayarı (sistem tercihine uyar): animasyonlar ve şehirdeki araçlar durur.
- Dokunma hedefleri en az 44px (sekmeler, 3B düğmesi, tutamaç). Yatay telefonda sahne gizlenir, alt çubuk ince olur (ui-ux-pro-max denetimi).
- Form alanlarına `name`/`aria-label`/`spellcheck`, `…` karakteri, `tabular-nums`, `overscroll-behavior`, `preconnect`, açıklama meta'sı.

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
