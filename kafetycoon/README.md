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

Yazı tipleri Google Fonts'tan yüklenir. Çevrimdışıysan sistem yazı tipine düşer, oyun yine çalışır.

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

## Prototip notları

- Reklam butonları (`Reklam`, `Reklam izle: x2`) **simülasyondur**, gerçek reklam SDK'sı yok.
- Ses yok.
- Grafikler tamamen kodla çizilir (Canvas), harici görsel dosyası yoktur.
- Ekonomi sayıları ilk denemedir, oynanış testine göre ayarlanmalıdır.

## Dosya yapısı

```
kafetycoon/
├── index.html   # Oyunun tamamı (HTML + CSS + JavaScript)
└── README.md    # Bu dosya
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
