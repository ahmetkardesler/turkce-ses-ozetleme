# Türkçe Ses Dönüştürme ve Özetleme Web Uygulaması

Bu proje, kullanıcıların yüklediği Türkçe ses dosyalarını (MP3, WAV, OGG, FLAC, M4A) metne dönüştüren ve ardından bu metni Google Gemini kullanarak özetleyen bir web uygulamasıdır.

## Özellikler

- **Ses Dosyası Yükleme:** Farklı formatlardaki ses dosyalarını kabul eder.
- **Ses Tanıma (Vosk):** Yüklenen ses dosyalarını Türkçe metne dönüştürmek için Vosk kütüphanesini kullanır.
- **Format Dönüşümü (FFmpeg):** Farklı ses formatlarını Vosk'un işleyebileceği WAV formatına dönüştürmek için FFmpeg'i kullanır.
- **Metin Özetleme (Gemini):** Vosk tarafından oluşturulan metni Google Gemini (1.5 Flash modeli) kullanarak özetler.
- **Web Arayüzü (React):** Kullanıcı dostu bir arayüz sunar, dosya yükleme, işlem durumu ve sonuçları (transkript ve özet) gösterir.
- **Backend API (Flask):** Ses işleme, Vosk, FFmpeg ve Gemini entegrasyonlarını yöneten bir Flask API sunar.

## Teknoloji Yığını

- **Frontend:**
  - React (Vite ile)
  - TypeScript
  - Tailwind CSS
- **Backend:**
  - Python 3.x
  - Flask
  - Vosk
  - Google Generative AI SDK (Gemini)
  - python-dotenv
- **Diğer:**
  - FFmpeg (Ses formatı dönüşümü için sistemde kurulu olmalı)

## Klasör Yapısı

```
vtest/
├── client/         # Frontend React uygulaması
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── ...
├── server/         # Backend Flask uygulaması
│   ├── model/      # İndirilen Vosk modeli buraya konulacak
│   ├── uploads/    # Geçici yükleme klasörü (.gitignore ile hariç tutulur)
│   ├── venv/       # Python sanal ortamı (.gitignore ile hariç tutulur)
│   ├── .env        # API anahtarı (.gitignore ile hariç tutulur)
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── .gitignore      # Git tarafından takip edilmeyecek dosyalar
└── README.md       # Bu dosya
```

## Kurulum

### Ön Gereksinimler

1.  **Node.js ve npm/yarn:** Frontend için gereklidir. [Node.js İndir](https://nodejs.org/)
2.  **Python 3.x:** Backend için gereklidir. [Python İndir](https://www.python.org/downloads/)
3.  **FFmpeg:** Ses dosyası dönüşümü için gereklidir. Sisteminizde kurulu ve PATH değişkeninde tanımlı olmalıdır. [FFmpeg İndir](https://ffmpeg.org/download.html)
    - Kurulumu doğrulamak için terminalde `ffmpeg -version` komutunu çalıştırın.
4.  **Git:** Versiyon kontrolü ve GitHub için gereklidir. [Git İndir](https://git-scm.com/downloads/)

### Adımlar

1.  **Projeyi Klonlayın (veya indirin):**

    ```bash
    git clone <repository_url> # Henüz yok, oluşturunca burayı güncelleyin
    cd vtest
    ```

2.  **Backend Kurulumu:**

    ```bash
    cd server

    # Sanal ortam oluştur (varsa atla)
    python -m venv venv

    # Sanal ortamı aktive et
    # Windows (PowerShell):
    .\venv\Scripts\Activate.ps1
    # Windows (CMD):
    .\venv\Scripts\activate.bat
    # macOS/Linux:
    # source venv/bin/activate

    # Bağımlılıkları kur
    pip install -r requirements.txt

    # Vosk Modelini İndir
    # https://alphacephei.com/vosk/models adresinden Türkçe modeli indirin.
    # İndirilen model klasörünü (örn. vosk-model-small-tr-0.3) server/model/ klasörü altına yerleştirin.
    # server/model/ klasörü yoksa oluşturun.
    # Dosya yapısı: server/model/vosk-model-small-tr-0.3/

    # Gemini API Anahtarını Ayarla
    # server/ dizininde .env adında bir dosya oluşturun.
    # İçine şu satırı ekleyin (kendi anahtarınızla değiştirin):
    # GOOGLE_API_KEY=AIzaSy...YOUR_API_KEY...

    cd .. # Kök dizine dön
    ```

    _Not: Linter (kod analiz aracı) sanal ortamdaki paketleri görmezse import hataları gösterebilir. Bu hatalar, sanal ortam aktifken kodu çalıştırdığınızda sorun yaratmaz._

3.  **Frontend Kurulumu:**
    ```bash
    cd client
    npm install  # veya yarn install
    cd .. # Kök dizine dön
    ```

## Çalıştırma

1.  **Backend Sunucusunu Başlat:**

    ```bash
    cd server
    # Sanal ortamın aktif olduğundan emin olun
    python app.py
    ```

    Backend `http://localhost:5001` adresinde çalışmaya başlayacaktır.

2.  **Frontend Geliştirme Sunucusunu Başlat:**
    _Ayrı bir terminal açın._
    ```bash
    cd client
    npm run dev
    ```
    Frontend genellikle `http://localhost:5173` (veya benzeri bir portta) açılacaktır. Tarayıcınızda bu adresi ziyaret edin.

## Katkıda Bulunma

Katkılarınız memnuniyetle karşılanır! Lütfen bir issue açın veya pull request gönderin.

## Lisans

Bu proje MIT Lisansı altındadır. Detaylar için `LICENSE` dosyasına bakın (eğer eklerseniz).
