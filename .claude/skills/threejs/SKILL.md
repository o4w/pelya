---
name: threejs
description: Köşe Kafe Tycoon projesinde Three.js (3B) kodu yazarken veya değiştirirken kullan. Depodaki sabit sürümlü Three.js, güvenlik kuralları, mobil performans sınırları ve test adımlarını içerir.
---

# Three.js kuralları (Köşe Kafe Tycoon)

3B kod `kafetycoon/three-view.js` içindedir. Oyun (`index.html`) ve demo (`3d-demo.html`) aynı modülü kullanır.
Şehir ana ekranı ayrı modüldür: `kafetycoon/three-hub.js` (izometrik, ortografik kamera, `assets/kaykit-city`). İşletme iç mekânı `kafetycoon/three-biz.js` (izometrik, `assets/kaykit-restaurant`). Aynı kuralları izler: yalnızca depodaki modeller, ortak malzeme, `dispose`, yedek yol (yüklenemezse oyun kafe görünümüne düşer).

## Kaynak ve güvenlik
- Three.js **yalnızca** `kafetycoon/vendor/three/` içinden yüklenir (importmap ile `three` adı buraya bağlanır). CDN kullanma.
- Sürümü değiştirmek için `kafetycoon/vendor/VENDOR.md` içindeki adımları izle: npm bütünlük değerini doğrula, SHA-256'ları güncelle.
- Dışarıdan (çalışma anında) model, doku, font veya betik yükleme yok: URL'den GLTF, HDR, uzak görsel kullanma. Modeller yalnızca depodaki `kafetycoon/assets/` altından yüklenir. Şu an `assets/kaykit-restaurant` ve `assets/kaykit-city` (KayKit Restaurant Bits ve City Builder Bits, CC0) var; kaynak, lisans ve SHA-256 değerleri orada `SOURCE.md` ve `SHA256SUMS` içinde. Yeni model paketi eklemeden önce kullanıcıdan onay al, lisansın CC0 (veya eşdeğeri) olduğunu resmi kaynaktan doğrula, boyutu söyle ve aynı belgeleri yaz. Modeller yüklenemezse kafe kodla üretilen şekillerle çizilmelidir (yedek yol kalsın). Diğer görseller kodla üretilir (basit geometri, `CanvasTexture`).
- Kullanıcıdan gelen metin (kafe adı vb.) yalnızca canvas'a `fillText` ile çizilir. Hiçbir zaman `innerHTML` ile sayfaya yazılmaz.
- `eval`, `new Function`, `setTimeout(string)` kullanma.
- 3B modül oyun durumunu **salt okunur** köprü (`bridge`) üzerinden okur: `S`, `customers`, `lanes`, `ROOMS`, `LANES_X`, `tablePos`, `getH()`, `clock()`. 3B kod oyun durumunu değiştirmez.

## Kaynak yönetimi ve performans (mobil öncelikli)
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`. Gölge haritası kullanma, gerekirse yuvarlak "blob" gölge çiz.
- Model malzemeleri tek ortak `MeshLambertMaterial` olarak değiştirilir (`userData.shared`), geometriler ortaktır; `disposeGroup` bunları silmez. `MeshLambertMaterial` kullan, malzemeleri renge göre önbelleğe al. Müşteri geometrileri ortaktır (`shared`).
- Statik sahne yalnızca imza (`signature*`) değişince yeniden kurulur. Her yeniden kurulumda eski grubun geometrilerini ve dokularını `disposeGroup` ile temizle.
- 3B kapatılınca `dispose()` çağır (`renderer.dispose()` ve `forceContextLoss()`). Sekme gizliyken `requestAnimationFrame` zaten durur, ek döngü kurma.
- `powerPreference: 'low-power'` ve düşük poligon (kapsül, küre, kutu). Müşteri başına birkaç mesh, çizim çağrısı sayısını düşük tut.

## Dayanıklılık
- WebGL yoksa `createView3D` hata fırlatır. Çağıran taraf 2B görünüme dönmeli ve kullanıcıya kısa mesaj vermelidir.
- `webglcontextlost` olayında 3B kapatılır, oyun 2B ile devam eder.
- ES modülleri `file://` ile çalışmaz. 3B için sayfa http(s) üzerinden açılmalıdır (yerelde `python3 -m http.server`).

## Test
1. `cd kafetycoon && python3 -m http.server 8765`
2. Playwright ile Chromium'u şu bayraklarla aç (GPU yok, yazılım WebGL): `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --no-sandbox`
3. `index.html` içinde "3B" düğmesine bas, `#cv3` görünür olmalı ve `pageerror` olmamalı. Dünya sekmesinde şehir görünümünü de dene. `3d-demo.html` sayfasını ayrıca aç.
4. Değişiklikten sonra ekran görüntüsüne bak, görüntü dosyalarını depoya koyma.
5. Sunucuyu durdururken `pkill -f` ile kendi komut satırını eşleştirme (kabuğu kapatır). PID ile `kill` kullan.
