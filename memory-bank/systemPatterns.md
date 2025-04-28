# Sistem Modelleri

## Sistem Mimarisi
- **Frontend:** React tabanlı tek sayfa uygulaması (SPA).
- **Backend:** Python (Flask/FastAPI) tabanlı bir API sunucusu.
- **İletişim:** Frontend, backend API'sine HTTP istekleri (REST veya GraphQL) gönderir.

## Bileşen Diyagramları
```mermaid
graph TD
    A[Kullanıcı Tarayıcısı (React App)] --> B(Backend API - Python/Flask);
    B --> C{Vosk Kütüphanesi};
    B --> D{Gemini API};
    C -- Metin Transkripti --> B;
    D -- Özetlenmiş Metin --> B;
    B -- Sonuçlar (Metin + Özet) --> A;
```

## Kullanılan Tasarım Desenleri
- **Frontend:** Bileşen tabanlı mimari (React).
- **Backend:** Servis katmanı (ses işleme, AI etkileşimi), API endpoint katmanı.

## Entegrasyon Noktaları
- **Vosk:** Python backend üzerinden yerel kütüphane çağrısı.
- **Gemini API:** Python backend üzerinden Google AI SDK veya HTTP isteği.

## Veri Akışı
1. Kullanıcı ses dosyasını React arayüzünden yükler.
2. React app, dosyayı backend API'sine gönderir.
3. Backend, dosyayı alır ve geçici olarak saklar.
4. Backend, Vosk'u kullanarak sesi metne dönüştürür.
5. Backend, dönüştürülen metni Gemini API'ye gönderir.
6. Gemini API, metnin özetini döndürür.
7. Backend, orijinal metni ve özeti frontend'e JSON olarak döndürür.
8. React app, sonuçları kullanıcı arayüzünde gösterir.