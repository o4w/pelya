# Üçüncü taraf kod: Three.js

Oyun Three.js'i bir CDN'den değil, bu klasörden yükler. Böylece çalışma anında dışarıdan kod çekilmez, sürüm sabittir ve değişiklikler depoda görünür.

| Alan | Değer |
|---|---|
| Paket | `three` (npm) |
| Sürüm | **0.170.0** |
| Lisans | MIT (`three/LICENSE`) |
| Kaynak | `npm pack three@0.170.0` |
| Paket bütünlüğü (npm) | `sha512-FQK+LEpYc0fBD+J8g6oSEyyNzjp+Q7Ks1C568WWaoMRLW+TkNNWmenWeGgJjV105Gd+p/2ql1ZcjYvNiPZBhuQ==` |

Paketin SHA-512 özeti, npm kayıt defterinin bildirdiği değerle birebir eşleşti. Kullanılan dosyalar paketten hiç değiştirilmeden kopyalandı:

| Dosya | SHA-256 |
|---|---|
| `three/three.module.min.js` | `08fd7545d13d2c7fb65ab691530a802dafefd638596501854f267d0fb13c39e7` |
| `three/examples/jsm/controls/OrbitControls.js` | `80efaadea4f8a636a65fb0bd08bfef62f3d93a0bb94e2e7500f23176c5c07f4e` |

`three.module.min.js` içindeki tek harici adres, XHTML ad alanı sabitidir (`http://www.w3.org/1999/xhtml`). Ağ isteği değildir.

## Sürüm güncelleme adımları
1. `npm view three@<yeni> dist.integrity` ile resmi bütünlük değerini al.
2. `npm pack three@<yeni>` ile paketi indir, `openssl dgst -sha512 -binary <paket>.tgz | base64 -w0` çıktısının aynı değer olduğunu doğrula.
3. İki dosyayı paketten kopyala (`build/three.module.min.js`, `examples/jsm/controls/OrbitControls.js`) ve LICENSE'ı yenile.
4. Bu dosyadaki sürüm ve özet değerlerini güncelle.
5. Oyunu ve `3d-demo.html` sayfasını tarayıcıda dene.
