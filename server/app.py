from vosk import Model, KaldiRecognizer, SetLogLevel
from flask_cors import CORS
from flask import Flask, request, jsonify, send_file
import google.generativeai as genai  # Gemini için eklendi
import subprocess  # FFmpeg için eklendi
import uuid
import json
import wave
import os
# .env dosyasını yüklemek için
from dotenv import load_dotenv
import io  # Hafızada dosya işlemleri için
from fpdf import FPDF  # PDF oluşturmak için
from docx import Document  # DOCX oluşturmak için
load_dotenv()


# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
# Model klasör adınız farklıysa burayı güncelleyin
MODEL_PATH = os.path.join('model', 'vosk-model-small-tr-0.3')
# Desteklenen uzantıları genişlet
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac', 'm4a'}
TARGET_SAMPLERATE = 16000  # Vosk modelinin beklediği örnekleme hızı
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
SUMMARY_PROMPT = "Aşağıdaki metni birkaç cümleyle özetle: \n\n{text}"

# --- Initialize Flask App and CORS ---
app = Flask(__name__)
CORS(app)

# --- Create Upload Folder ---
if not os.path.exists(UPLOAD_FOLDER):
    try:
        os.makedirs(UPLOAD_FOLDER)
        print(f"'{UPLOAD_FOLDER}' klasörü oluşturuldu.")
    except OSError as e:
        print(f"'{UPLOAD_FOLDER}' klasörü oluşturulurken hata: {e}")
        # Klasör oluşturulamazsa devam etmek mantıklı olmayabilir

# --- Load Vosk Model ---
SetLogLevel(-1)  # Vosk loglarını azalt

if not os.path.exists(MODEL_PATH):
    print(f"HATA: Vosk modeli '{MODEL_PATH}' adresinde bulunamadı.")
    print("Lütfen modeli indirip doğru konuma (server/model/klasor_adi) yerleştirdiğinizden emin olun.")
    model = None
else:
    try:
        model = Model(MODEL_PATH)
        print(f"Vosk modeli '{MODEL_PATH}' başarıyla yüklendi.")
    except Exception as e:
        print(f"Vosk modeli yüklenirken hata oluştu ({MODEL_PATH}): {e}")
        model = None  # Model yüklenemezse None olarak ayarla

# --- Configure Gemini ---
gemini_model = None
if not GOOGLE_API_KEY:
    print("UYARI: GOOGLE_API_KEY ortam değişkeni bulunamadı. Gemini özetleme devre dışı bırakılacak.")
else:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        # Kullanılabilir modelleri görmek için: list(genai.list_models())
        # Özetleme için uygun ve hızlı bir model seçelim (örn. gemini-1.5-flash)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("Gemini modeli başarıyla yapılandırıldı.")
    except Exception as e:
        print(f"Gemini yapılandırılırken hata oluştu: {e}")


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def hello():
    return "Backend Çalışıyor! (Vosk & FFmpeg Entegre Edildi)"


@app.route('/upload', methods=['POST'])
def upload_file():
    global model
    if model is None:
        print("Hata: Vosk modeli yüklenmediği için işlem yapılamıyor.")
        return jsonify({"error": "Ses tanıma modeli sunucuda yüklenemedi."}), 500

    if 'file' not in request.files:
        return jsonify({"error": "İstekte dosya bulunamadı"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Dosya adı boş, dosya seçilmedi"}), 400

    if file and allowed_file(file.filename):
        original_filename = file.filename
        # Geçici dosyalar için benzersiz isimler
        temp_id = str(uuid.uuid4())
        original_extension = original_filename.rsplit('.', 1)[1].lower()
        temp_input_filename = f"{temp_id}.{original_extension}"
        # Dönüştürülmüş dosya
        temp_output_filename = f"{temp_id}_converted.wav"
        temp_input_filepath = os.path.join(UPLOAD_FOLDER, temp_input_filename)
        temp_output_filepath = os.path.join(
            UPLOAD_FOLDER, temp_output_filename)

        filepath_to_process = None
        full_transcription = ""

        try:
            # 1. Orijinal dosyayı kaydet
            file.save(temp_input_filepath)
            print(f"Dosya geçici olarak kaydedildi: {temp_input_filepath}")

            # 2. FFmpeg ile dönüştürme (16kHz, mono, s16 WAV)
            print(
                f"FFmpeg ile '{temp_output_filepath}' dosyasına dönüştürülüyor...")
            ffmpeg_command = [
                'ffmpeg',
                '-i', temp_input_filepath,  # Giriş dosyası
                '-ar', str(TARGET_SAMPLERATE),  # Örnekleme hızı
                '-ac', '1',           # Kanal sayısı (mono)
                '-sample_fmt', 's16',  # Örnek formatı (16-bit PCM)
                '-y',                # Üzerine yaz
                '-loglevel', 'error',  # Hataları göster, diğer logları gizle
                temp_output_filepath   # Çıkış dosyası
            ]

            process = subprocess.run(
                ffmpeg_command, capture_output=True, text=True, check=False)

            if process.returncode != 0:
                print(
                    f"FFmpeg hatası (kod {process.returncode}): {process.stderr}")
                # Eğer orijinal dosya zaten WAV ise ve doğru formatta ise onu kullanmayı dene?
                # Şimdilik hata verelim.
                raise Exception(
                    f"FFmpeg ses dönüştürme hatası: {process.stderr}")
            else:
                print(f"FFmpeg dönüşümü başarılı: {temp_output_filepath}")
                filepath_to_process = temp_output_filepath

            # 3. Dönüştürülmüş WAV dosyasını Vosk ile işle
            if filepath_to_process:
                wf = wave.open(filepath_to_process, "rb")
                if wf.getframerate() != TARGET_SAMPLERATE or wf.getnchannels() != 1:
                    # FFmpeg'in işini doğru yaptığını varsayıyoruz ama yine de kontrol edelim
                    print(
                        f"Uyarı: Dönüştürülmüş dosya hala beklenen formatta değil ({wf.getframerate()}Hz, {wf.getnchannels()} kanal). Vosk hatası olabilir.")

                rec = KaldiRecognizer(model, wf.getframerate())
                rec.SetWords(False)

                results = []
                while True:
                    data = wf.readframes(4000)
                    if len(data) == 0:
                        break
                    if rec.AcceptWaveform(data):
                        result_json = json.loads(rec.Result())
                        results.append(result_json.get('text', ''))

                final_result_json = json.loads(rec.FinalResult())
                results.append(final_result_json.get('text', ''))
                full_transcription = " ".join(filter(None, results)).strip()
                print(f"Transkripsiyon tamamlandı.")
                wf.close()
            else:
                # Bu duruma normalde gelinmemeli (dönüşüm başarılıysa path atanır)
                print("Hata: İşlenecek dönüştürülmüş dosya bulunamadı.")
                raise Exception("Ses dosyası dönüştürülemedi veya işlenemedi.")

            # Sadece transkripsiyonu döndür
            return jsonify({
                "message": "Dosya başarıyla metne dönüştürüldü.",
                "filename": original_filename,
                "transcription": full_transcription,
            })

        except FileNotFoundError as e:
            # Genellikle FFmpeg komutu bulunamadığında olur
            print(
                f"Hata: FFmpeg komutu bulunamadı veya çalıştırılamadı. Sisteminizde kurulu ve PATH'de olduğundan emin olun. Detay: {e}")
            return jsonify({"error": "Ses dönüştürme aracı (FFmpeg) sunucuda bulunamadı veya çalıştırılamadı."}), 500
        except Exception as e:
            print(f"Dosya işlenirken hata oluştu: {e}")
            return jsonify({"error": f"Dosya işlenirken beklenmedik bir sunucu hatası oluştu: {e}"}), 500
        finally:
            # 4. Geçici dosyaları sil
            if os.path.exists(temp_input_filepath):
                try:
                    os.remove(temp_input_filepath)
                    print(
                        f"Geçici giriş dosyası silindi: {temp_input_filepath}")
                except OSError as e:
                    print(
                        f"Geçici giriş dosyası silinirken hata ({temp_input_filepath}): {e}")
            if os.path.exists(temp_output_filepath):
                try:
                    os.remove(temp_output_filepath)
                    print(
                        f"Geçici çıkış dosyası silindi: {temp_output_filepath}")
                except OSError as e:
                    print(
                        f"Geçici çıkış dosyası silinirken hata ({temp_output_filepath}): {e}")

    else:
        allowed_types = ", ".join(ALLOWED_EXTENSIONS)
        return jsonify({"error": f"İzin verilmeyen dosya türü. Desteklenen türler: {allowed_types}"}), 400


# Yeni Özetleme Endpoint'i
@app.route('/summarize', methods=['POST'])
def summarize_text():
    # İstekten JSON verisini al
    data = request.get_json()
    if not data or 'transcription' not in data:
        return jsonify({"error": "İstekte 'transcription' alanı bulunamadı veya JSON formatı hatalı."}), 400

    transcription = data['transcription']

    if not transcription:
        return jsonify({"error": "Özetlenecek metin boş olamaz."}), 400

    # Yardımcı fonksiyonu kullanarak özeti al
    summary = get_gemini_summary(transcription)

    return jsonify({
        "summary": summary
    })


# Gemini özetleme için yardımcı fonksiyon (opsiyonel ama kodu temizler)
def get_gemini_summary(text_to_summarize):
    global gemini_model
    if not gemini_model or not text_to_summarize:
        print("Uyarı: Gemini modeli yok veya metin boş, özetleme yapılamıyor.")
        # Duruma göre farklı mesajlar döndürülebilir
        if not gemini_model:
            return "[Özetleme yapılamadı - Model yüklenmedi]"
        else:
            return "[Özetleme yapılamadı - Transkripsiyon boş]"

    try:
        print("Gemini ile özetleme başlatılıyor...")
        prompt_text = SUMMARY_PROMPT.format(text=text_to_summarize)
        response = gemini_model.generate_content(prompt_text)
        summary = response.text.strip()
        print("Gemini özetlemesi tamamlandı.")
        return summary
    except Exception as e:
        print(f"Gemini API çağrısı sırasında hata oluştu: {e}")
        return "[Özetleme sırasında bir hata oluştu]"


@app.route('/export/pdf', methods=['POST'])
def export_pdf():
    data = request.get_json()
    if not data or 'content' not in data or 'type' not in data:
        return jsonify({"error": "İstekte 'content' ve 'type' alanları bulunamadı."}), 400

    content = data.get('content', '')
    export_type = data.get('type', 'export')  # transcription veya summary
    filename = f"{export_type}.pdf"

    try:
        pdf = FPDF()
        pdf.add_page()

        # Projeye eklenen fontun yolunu belirt
        font_path = os.path.join('fonts', 'DejaVuSans.ttf')

        try:
            # Fontu tam yoluyla ekle (uni=True kaldırıldı)
            pdf.add_font("DejaVu", "", font_path)
            pdf.set_font("DejaVu", size=12)
            print(f"Font başarıyla eklendi: {font_path}")
        except RuntimeError as font_error:
            print(
                f"UYARI: Belirtilen font ({font_path}) yüklenemedi: {font_error}. Standart font kullanılıyor, Türkçe karakterler sorunlu olabilir.")
            # Fallback olarak Arial kullanmaya devam et
            try:
                pdf.set_font("Arial", size=12)
            except RuntimeError:
                print("HATA: Arial fontu da yüklenemedi. PDF oluşturulamıyor.")
                return jsonify({"error": "PDF oluşturmak için gerekli fontlar yüklenemedi."}), 500

        pdf.multi_cell(0, 10, content)

        # PDF'i hafızada oluştur
        pdf_output = io.BytesIO()
        # FPDF 2.8.0+ ile doğrudan BytesIO'ya yazılabilir
        pdf.output(pdf_output)
        pdf_output.seek(0)

        print(f"PDF oluşturuldu: {filename}")

        return send_file(
            pdf_output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename  # Tarayıcıda görünecek dosya adı
        )
    except Exception as e:
        print(f"PDF oluşturulurken hata: {e}")
        return jsonify({"error": "PDF dosyası oluşturulurken bir sunucu hatası oluştu."}), 500


@app.route('/export/docx', methods=['POST'])
def export_docx():
    data = request.get_json()
    if not data or 'content' not in data or 'type' not in data:
        return jsonify({"error": "İstekte 'content' ve 'type' alanları bulunamadı."}), 400

    content = data.get('content', '')
    export_type = data.get('type', 'export')  # transcription veya summary
    filename = f"{export_type}.docx"

    try:
        document = Document()
        document.add_paragraph(content)

        # DOCX'i hafızada oluştur
        docx_output = io.BytesIO()
        document.save(docx_output)
        docx_output.seek(0)

        print(f"DOCX oluşturuldu: {filename}")

        return send_file(
            docx_output,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        print(f"DOCX oluşturulurken hata: {e}")
        return jsonify({"error": "Word dosyası oluşturulurken bir sunucu hatası oluştu."}), 500


if __name__ == '__main__':
    # Debug modunda ve farklı bir portta çalıştır
    app.run(debug=True, port=5001)
