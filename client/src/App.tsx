import { useState } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

function App() {
  // const [count, setCount] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setTranscription("");
      setSummary("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Lütfen önce bir dosya seçin.");
      return;
    }
    console.log("Yüklenecek dosya:", selectedFile);
    setIsLoading(true);
    setTranscription("");
    setSummary("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:5001/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Bilinmeyen bir backend hatası oluştu." }));
        throw new Error(
          errorData.error || `HTTP hatası! Durum: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Backend yanıtı:", data);

      // Backend'den gelen transkripsiyon ve özeti state'e ata
      if (data.transcription) {
        setTranscription(data.transcription);
      }
      if (data.summary) {
        // Şimdilik bu hala yer tutucu olacak
        setSummary(data.summary);
      }

      // Başarı mesajını alert yerine konsola yazabiliriz veya kaldırabiliriz
      // alert(data.message || "Dosya başarıyla işlendi.");
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Dosya yüklenirken bir hata oluştu.";
      alert(`Hata: ${errorMessage}`);
      setTranscription("");
      setSummary("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
          Türkçe Ses Dönüştürme & Özetleme
        </h1>

        <div className="upload-section border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-8 flex flex-col items-center space-y-4">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 font-medium py-2 px-4 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            {selectedFile
              ? selectedFile.name
              : "Ses Dosyası Seçin (.mp3, .wav, vb.)"}
          </label>
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden" // Gerçek inputu gizle, label ile kontrol et
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className={`w-full sm:w-auto px-6 py-2 rounded-md text-white font-semibold transition-colors duration-200 flex items-center justify-center 
              ${
                !selectedFile || isLoading
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                İşleniyor...
              </span>
            ) : (
              "Yükle ve İşle"
            )}
          </button>
        </div>

        {(transcription || summary) && !isLoading && (
          <div className="results-section space-y-6">
            {transcription && (
              <div className="transcription bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Metin Transkripti
                </h2>
                <textarea
                  readOnly
                  value={transcription}
                  className="w-full h-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                ></textarea>
              </div>
            )}
            {summary && (
              <div className="summary bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Özet
                </h2>
                <textarea
                  readOnly
                  value={summary}
                  className="w-full h-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                ></textarea>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
