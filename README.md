# Turkish Speech-to-Text and Summarization Web App

This project is a web application that transcribes Turkish audio into text either from user-uploaded audio files (MP3, WAV, OGG, FLAC, M4A) or from YouTube video links. Optionally, users can then summarize the generated transcript using Google Gemini and export either the transcript or the summary to PDF or DOCX formats.

## Features

- **Audio File Upload:** Accepts audio files in various common formats.
- **YouTube Link Processing:** Accepts YouTube video links, extracts the audio, and transcribes it.
- **Speech Recognition (Vosk):** Uses the Vosk library to convert audio (from file or YouTube) into Turkish text.
- **Format Conversion (FFmpeg):** Uses FFmpeg internally (via Vosk setup and yt-dlp) to handle various audio formats and ensure compatibility with Vosk.
- **Optional Text Summarization (Gemini):** Summarizes the generated transcript on demand using Google Gemini (1.5 Flash model).
- **Export Results:** Allows exporting the full transcript or the summary to PDF and Microsoft Word (.docx) formats.
- **Web Interface (React):** Provides a user-friendly interface for uploading files or entering YouTube links, displaying the transcript, triggering summarization, and exporting results.
- **Backend API (Flask):** Offers a Flask API to manage audio processing, format conversion, speech recognition (Vosk), YouTube audio extraction (yt-dlp), summarization (Gemini), and file export.

## Technology Stack

- **Frontend:**
  - React (with Vite)
  - TypeScript
  - Tailwind CSS
- **Backend:**
  - Python 3.x
  - Flask
  - Vosk (Speech Recognition)
  - `yt-dlp` (YouTube Audio Extraction)
  - Google Generative AI SDK (Gemini Summarization)
  - `fpdf2` (PDF Export)
  - `python-docx` (DOCX Export)
  - `python-dotenv` (Environment Variable Management)
- **Other:**
  - FFmpeg (Must be installed on the system for audio format conversion, used by Vosk and yt-dlp)

## Folder Structure

```
vtest/
├── client/         # Frontend React application
│   └── ...
├── server/         # Backend Flask application
│   ├── fonts/      # Font files for PDF export (e.g., DejaVuSans.ttf)
│   ├── model/      # Downloaded Vosk model
│   ├── uploads/    # Temporary upload/download folder (excluded by .gitignore)
│   ├── venv/       # Python virtual environment (excluded by .gitignore)
│   ├── .env        # API key (excluded by .gitignore)
│   ├── app.py      # Main Flask application
│   ├── requirements.txt
│   └── ...
├── .gitignore      # Files to be ignored by Git
├── README.md       # This file
└── run_dev.bat     # Helper script to start servers (Windows, ignored by Git)
```

## Setup

### Prerequisites

1.  **Node.js and npm/yarn:** Required for the frontend. [Download Node.js](https://nodejs.org/)
2.  **Python 3.x:** Required for the backend. [Download Python](https://www.python.org/downloads/)
3.  **FFmpeg:** Required for audio file conversion by Vosk and yt-dlp. Must be installed on your system and available in the PATH environment variable. [Download FFmpeg](https://ffmpeg.org/download.html)
    - Verify the installation by running `ffmpeg -version` in your terminal.
4.  **Git:** Required for version control and GitHub. [Download Git](https://git-scm.com/downloads/)

### Steps

1.  **Clone (or download) the project:**

    ```bash
    git clone <repository_url> # Update this with your repository URL
    cd vtest
    ```

2.  **Backend Setup:**

    ```bash
    cd server

    # Create a virtual environment (skip if it already exists)
    python -m venv venv

    # Activate the virtual environment
    # Windows (PowerShell): .\venv\Scripts\Activate.ps1
    # Windows (CMD):        .\venv\Scripts\activate.bat
    # macOS/Linux:          source venv/bin/activate

    # Install dependencies (includes Flask, Vosk, yt-dlp, Gemini SDK, export libs)
    pip install -r requirements.txt

    # Download the Vosk Model
    # Download the Turkish model from https://alphacephei.com/vosk/models.
    # Place the downloaded model folder (e.g., vosk-model-small-tr-0.3) under the server/model/ directory.
    # Create the server/model/ directory if it doesn't exist.

    # Download Font for PDF Export (Optional but Recommended for Turkish Characters)
    # Download a TTF font supporting Turkish characters (e.g., DejaVuSans.ttf from https://dejavu-fonts.github.io/).
    # Create a `fonts` directory inside `server/`.
    # Place the downloaded .ttf file (e.g., `DejaVuSans.ttf`) inside the `server/fonts/` directory.
    # (The code currently expects `server/fonts/DejaVuSans.ttf`)

    # Set up the Gemini API Key
    # Create a file named .env in the server/ directory.
    # Add the following line to it (replace with your own key):
    # GOOGLE_API_KEY=AIzaSy...YOUR_API_KEY...

    cd .. # Return to the root directory
    ```

    _Note: Your linter (code analysis tool) might show import errors if it doesn't recognize the packages in the virtual environment. These errors should not prevent the code from running when the virtual environment is active._

3.  **Frontend Setup:**
    ```bash
    cd client
    npm install  # or yarn install
    cd .. # Return to the root directory
    ```

## Running the Application

- **Easy Way (Windows):** Double-click the `run_dev.bat` file in the project root directory (`vtest/`). This will open two separate command prompts, one for the backend and one for the frontend.

- **Manual Way:**

  1.  **Start the Backend Server:**
      _Open a terminal._

      ```bash
      cd server
      # Activate virtual environment (see Backend Setup)
      python app.py
      ```

      The backend will start running at `http://localhost:5001`.

  2.  **Start the Frontend Development Server:**
      _Open a separate terminal._
      ```bash
      cd client
      npm run dev
      ```
      The frontend will usually open at `http://localhost:5173` (or a similar port). Visit this address in your browser.

## Usage

1.  Open the web application in your browser.
2.  Choose your input method:
    - **Audio File:** Click the "Select Audio File" area to choose an audio file (MP3, WAV, etc.). Then click "Upload and Transcribe".
    - **YouTube Link:** Paste a valid YouTube video URL into the "YouTube Video Link" input field. Then click "Process YouTube Video".
3.  Wait for the transcription to appear. The title of the YouTube video will be shown next to the transcript header if applicable.
4.  Optionally, click the "Summarize" button next to the transcript title.
5.  Wait for the summary to appear.
6.  Click the "PDF" or "DOCX" buttons next to the transcript or summary titles to export them.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details (if you add one).
