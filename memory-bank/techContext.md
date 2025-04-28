# Teknik İçerik

## Teknoloji Yığını
- **Frontend:**
    - Dil: JavaScript (ES6+)
    - Kütüphane/Framework: React
    - Paket Yöneticisi: npm veya yarn
    - CSS: Tailwind CSS veya Material UI (Karar verilecek)
- **Backend:**
    - Dil: Python 3.x
    - Framework: Flask veya FastAPI (Flask ile başlanabilir, basitlik için)
    - Ses İşleme: Vosk-API (Python binding)
    - AI Entegrasyonu: Google Generative AI SDK (`google-generativeai`)
- **Veritabanı:** (Başlangıçta gerekli değil, P2 özellikleri için düşünülebilir - örn. SQLite, PostgreSQL)

## Geliştirme Ortamı
- **Kod Editörü:** VS Code / Cursor
- **Sürüm Kontrol:** Git, GitHub/GitLab
- **Backend Bağımlılık Yönetimi:** pip, `requirements.txt`
- **Vosk Model:** Türkçe için uygun bir Vosk modeli indirilecek ve backend erişimine sunulacak.

## Dağıtım Süreci (Deployment)
- **Başlangıç:** Yerel makinede çalıştırma.
- **Gelecek:**
    - Frontend: Netlify, Vercel gibi statik hosting servisleri.
    - Backend: Docker konteyneri içinde Heroku, Google Cloud Run, veya benzeri bir PaaS.

## Performans Değerlendirmeleri
- Ses dönüştürme süresi dosya boyutuna ve sunucu/makine kaynaklarına bağlı olacaktır.
- Gemini API yanıt süresi.
- Büyük dosyaların yüklenmesi ve işlenmesi için asenkron görevler (örn. Celery ile) düşünülebilir.

## Teknik Borç
- Başlangıçta hata yönetimi ve loglama minimum düzeyde tutulabilir.
- Test kapsamı başlangıçta sınırlı olabilir.