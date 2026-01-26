# URL Request Tester

Bu proje, belirli aralıklarla bir URL'ye GET istekleri göndermek için tasarlanmış bir Node.js uygulamasıdır. Paralel istek gönderme ve konfigürasyon tabanlı çalışma özelliklerini destekler. Program çalıştırıldığında 10 saniye geri sayım başlar.

## Özellikler

- **Konfigürasyon tabanlı**: `config.json` dosyası ile ayarlar
- **Zaman aşımı desteği**: Bağlantı zaman aşımı ayarı
- **Paralel istekler**: Çoklu istek gönderme desteği
- **Otomatik HTTPS**: URL'ye https:// ekleme
- **Güvenilir User-Agent**: Tarayıcı benzeri User-Agent header'ı
- **Load desteği**: İsteklere ek veri yükleme
- **Rate limiting**: Console log'larının çok fazla basılmasını önler
- **Detaylı loglama**: İstek süresi ve durum kodları (rate limited)
- **İstatistik takibi**: Ctrl+C ile durdurulduğunda kapsamlı rapor (akıllı süre formatı)
- **Güvenlik beklemesi**: Program başlatıldığında 10 saniye geri sayım

## Kurulum

```bash
# Bağımlılıkları yükle (varsa)
npm install
```

## Konfigürasyon

`config.json` dosyasında aşağıdaki ayarları yapabilirsiniz:

```json
{
  "timeout": 10000,
  "waiting_interval": 1000,
  "multiple_requests": false,
  "multiple_count": 10,
  "load": false,
  "load_size": 1024,
  "aggressive_mode": false
}
```

*Not: `load_size` değeri byte cinsindendir. 1024 = 1 KB, 1048576 = 1 MB veri gönderir.
`aggressive_mode` true ise sistem optimizasyonları aktif olur: Multi-process (CPU çekirdeği başına worker), connection pooling, yüksek paralel bağlantı.*

### Ayarlar Açıklaması

- `timeout`: Bağlantının ne kadar sürede cevap vermezse sonlanacağını belirler (milisaniye)
- `waiting_interval`: Her istek arasında ne kadar süre olacağını belirler (milisaniye)
- `multiple_requests`: Paralel istek gönderme özelliğini açar/kapatır (true/false)
- `multiple_count`: `multiple_requests` true ise aynı anda kaç tane istek yapılacağını belirler
- `load`: İsteklere yük ekleme özelliğini açar/kapatır (true/false)
- `load_size`: `load` true ise her isteğe eklenecek veri boyutu (byte)
- `aggressive_mode`: Sistem optimizasyonlarını aktif eder (true/false) - Multi-process, connection pooling

## Kullanım

```bash
node start.js <url>
```

**Not:** Program çalıştırıldığında 10 saniye geri sayım başlar. Bu süre içinde Ctrl+C ile iptal edebilirsiniz.

### Örnekler

```bash
# Basit kullanım
node start.js google.com

# HTTPS ile
node start.js https://www.google.com

# HTTP ile
node start.js http://example.com
```

## Modüller

### start.js
**Ana uygulama giriş noktası**
- Uygulamayı başlatır
- Signal handler'ları ayarlar
- Diğer modülleri orchestrate eder

### app.js
**Uygulama başlatma mantığı**
- Konfigürasyon yükleme
- Request handler oluşturma
- URL doğrulama ve ayarlama

### loop.js
**Ana döngü yönetimi**
- Sürekli istek gönderme döngüsü
- Timer yönetimi
- Döngü başlatma/durdurma

### stats.js
**İstatistik hesaplamaları**
- İstek istatistiklerini takip eder
- Başarı/hata oranları hesaplar
- Raporlama işlevselliği

### logger.js
**Loglama yardımcıları**
- Farklı türde log mesajları
- Tutarlı format sağlama

### settings.js
**Konfigürasyon yönetimi**
- config.json dosyasını yükler
- Ayarları doğrular ve yönetir

### request.js
**HTTP istek işlemleri**
- HTTP/HTTPS istekleri gönderir
- Response'ları işler
- İstatistik toplama

## Çıktı Örneği

```
Hedef URL: https://google.com
Konfigürasyon:
  Timeout: 10000ms
  Bekleme aralığı: 1000ms
  Çoklu istek: Hayır
  Çoklu istek sayısı: 5
  Load: Hayır
  Load boyutu: 1024 bytes
  Aggressive Mode: Hayır
---

⏳ Saldırı 10 saniye sonra başlayacak...
🚀 Saldırı başlatılıyor!

✅ İstek Gönderildi: 1. İstek | [200]: Success | 245ms
✅ İstek Gönderildi: 2. İstek | [200]: Success | 198ms
...
```

## İstatistik Örneği

Ctrl+C ile durdurulduğunda gösterilen rapor:

```

📊 === İSTEK İSTATİSTİKLERİ ===
⏱️  Çalışma Süresi: 1 saat, 23 dakika, 45 saniye
📤 Toplam İstek: 150
✅ Başarılı: 142
❌ Başarısız: 8
📊 Başarı Oranı: %94.7
⏳ Ortalama Yanıt Süresi: 245.3ms
💾 Gönderilen Veri: 150.0 KB (0.15 MB)
================================
```

## Dikkat Edilecek Noktalar

- Uygulama çalıştırıldığında 10 saniye bekleme süresi başlar
- Bekleme sırasında Ctrl+C ile iptal edebilirsiniz
- Uygulama sonsuz döngüde çalışır, durdurmak için Ctrl+C kullanın
- Log'lar rate limited: Çok hızlı isteklerde console tıkanması önlenir
- Ctrl+C ile durdurulduğunda detaylı istatistikler gösterilir
- Yüksek paralel istek sayısı hedef sunucuyu etkileyebilir
- Timeout süresi çok kısa olmamalıdır
- Konfigürasyon dosyası proje dizininin kökünde olmalıdır
- **Aggressive mode sistemi yüksek oranda yükler - dikkatli kullanın!**
- Aggressive mode'da çoklu process kullanılır, sistem kaynaklarını yoğun tüketir

## Gereksinimler


- Node.js >= 14.0.0
