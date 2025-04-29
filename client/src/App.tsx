import { useState, useEffect, useRef } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

function App() {
  // const [count, setCount] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (isLoading || isSummarizing) {
      setElapsedTime(0);
      intervalRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading, isSummarizing]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setVideoTitle("");
      setTranscription("");
      setSummary("");
    }
  };

  const handleYoutubeUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setYoutubeUrl(event.target.value);
    setVideoTitle("");
    setTranscription("");
    setSummary("");
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

      // Backend'den gelen transkripsiyonu state'e ata
      if (data.transcription) {
        setTranscription(data.transcription);
      }
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

  const handleProcessYoutube = async () => {
    if (!youtubeUrl || !youtubeUrl.trim()) {
      alert("Lütfen bir YouTube linki girin.");
      return;
    }

    if (
      !youtubeUrl.includes("youtube.com/") &&
      !youtubeUrl.includes("youtu.be/")
    ) {
      alert("Geçerli bir YouTube linki giriniz.");
      return;
    }

    console.log("İşlenecek YouTube linki:", youtubeUrl);
    setIsLoading(true);
    setTranscription("");
    setSummary("");

    try {
      const response = await fetch("http://localhost:5001/process_youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
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
      console.log("Backend yanıtı (YouTube):", data);

      if (data.transcription) {
        setTranscription(data.transcription);
        setVideoTitle(data.video_title || "YouTube Video");
      }
    } catch (error) {
      console.error("YouTube işleme hatası:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "YouTube videosu işlenirken bir hata oluştu.";
      alert(`Hata: ${errorMessage}`);
      setTranscription("");
      setSummary("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!transcription) {
      alert("Özetlenecek bir metin bulunamadı.");
      return;
    }
    console.log("Özetleme isteği gönderiliyor...");
    setIsSummarizing(true);
    setSummary("");

    try {
      const response = await fetch("http://localhost:5001/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription: transcription }),
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
      console.log("Backend /summarize yanıtı:", data);

      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary("[Özet alınamadı]");
      }
    } catch (error) {
      console.error("Özetleme hatası:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Özetleme sırasında bir hata oluştu.";
      alert(`Hata: ${errorMessage}`);
      setSummary("[Özetleme hatası oluştu]");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Yeni Export Fonksiyonu
  const handleExport = async (
    format: "pdf" | "docx",
    type: "transcription" | "summary"
  ) => {
    const content = type === "transcription" ? transcription : summary;
    if (!content) {
      alert("Dışa aktarılacak içerik bulunamadı.");
      return;
    }

    const endpoint = `/export/${format}`;
    const filename = `${type}.${format}`;
    console.log(`Dışa aktarma isteği: ${endpoint} for ${type}`);

    // TODO: İsteğe bağlı olarak export sırasında butonları disable etmek için state eklenebilir

    try {
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content, type: type }),
      });

      if (!response.ok) {
        // Hata durumunda JSON yanıtı beklenir
        const errorData = await response
          .json()
          .catch(() => ({ error: "Bilinmeyen bir backend hatası oluştu." }));
        throw new Error(
          errorData.error || `HTTP hatası! Durum: ${response.status}`
        );
      }

      // Başarılı yanıtta dosya içeriği (blob) beklenir
      const blob = await response.blob();

      // Tarayıcıda indirme işlemini tetikle
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Linki temizle
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url); // Belleği serbest bırak
    } catch (error) {
      console.error(`Dışa aktarma hatası (${format}, ${type}):`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Dosya dışa aktarılırken bir hata oluştu.";
      alert(`Hata: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
          Türkçe Ses Dönüştürme & Özetleme
        </h1>

        <div className="mb-8 space-y-6">
          {/* Dosya Yükleme Bölümü */}
          <div className="upload-section border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Ses Dosyası ile
            </h2>
            <label
              htmlFor="file-upload"
              className={`cursor-pointer bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 font-medium py-2 px-4 rounded-md hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors duration-200 ${
                isLoading || isSummarizing
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
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
              disabled={isLoading || isSummarizing}
              className="hidden"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading || isSummarizing}
              className={`w-full sm:w-auto px-6 py-2 rounded-md text-white font-semibold transition-colors duration-200 flex items-center justify-center 
                ${
                  !selectedFile || isLoading || isSummarizing
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                }`}
            >
              {isLoading && selectedFile ? (
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
                  Dönüştürülüyor... ({elapsedTime}s)
                </span>
              ) : (
                "Yükle ve Metne Dönüştür"
              )}
            </button>
          </div>

          {/* VEYA Ayırıcı */}
          <div className="flex items-center justify-center">
            <div className="border-t border-gray-300 dark:border-gray-600 w-1/3"></div>
            <div className="mx-4 text-gray-500 dark:text-gray-400 font-medium">
              VEYA
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 w-1/3"></div>
          </div>

          {/* YouTube Link İşleme Bölümü */}
          <div className="youtube-section border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              YouTube Video ile
            </h2>
            <div className="w-full">
              <input
                id="youtube-link"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={handleYoutubeUrlChange}
                disabled={isLoading || isSummarizing}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
              {videoTitle && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                  Video: {videoTitle}
                </p>
              )}
            </div>
            <button
              onClick={handleProcessYoutube}
              disabled={!youtubeUrl || isLoading || isSummarizing}
              className={`w-full sm:w-auto px-6 py-2 rounded-md text-white font-semibold transition-colors duration-200 flex items-center justify-center 
                ${
                  !youtubeUrl || isLoading || isSummarizing
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                }`}
            >
              {isLoading && youtubeUrl ? (
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
                  YouTube İşleniyor... ({elapsedTime}s)
                </span>
              ) : (
                "YouTube Videosunu İşle"
              )}
            </button>
          </div>
        </div>

        {(transcription || summary || isSummarizing) && !isLoading && (
          <div className="results-section space-y-6">
            {transcription && (
              <div className="transcription bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Metin Transkripti{" "}
                    {videoTitle && (
                      <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">
                        ({videoTitle})
                      </span>
                    )}
                  </h2>
                  <div className="flex gap-2">
                    {!summary && !isSummarizing && (
                      <button
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className={`px-4 py-1 rounded-md text-sm text-white font-medium transition-colors duration-200 flex items-center justify-center 
                          ${
                            isSummarizing
                              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                          }`}
                      >
                        Özetle
                      </button>
                    )}
                    <button
                      onClick={() => handleExport("pdf", "transcription")}
                      className="px-3 py-1 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white font-medium transition-colors duration-200"
                      title="PDF olarak dışa aktar"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => handleExport("docx", "transcription")}
                      className="px-3 py-1 rounded-md text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors duration-200"
                      title="Word olarak dışa aktar"
                    >
                      DOCX
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={transcription}
                  className="w-full h-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                ></textarea>
              </div>
            )}
            {(summary || isSummarizing) && (
              <div className="summary bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Özet
                  </h2>
                  {!isSummarizing && summary && !summary.startsWith("[") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExport("pdf", "summary")}
                        className="px-3 py-1 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white font-medium transition-colors duration-200"
                        title="PDF olarak dışa aktar"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleExport("docx", "summary")}
                        className="px-3 py-1 rounded-md text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors duration-200"
                        title="Word olarak dışa aktar"
                      >
                        DOCX
                      </button>
                    </div>
                  )}
                </div>
                {isSummarizing ? (
                  <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                    <span className="mr-2">Özetleniyor</span>
                    <div className="pulsing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="ml-2">({elapsedTime}s)</span>
                  </div>
                ) : (
                  <textarea
                    readOnly
                    value={summary}
                    className="w-full h-48 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  ></textarea>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
