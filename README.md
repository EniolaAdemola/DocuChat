## DocuChat – Document Q&A Assistant

DocuChat is an app that lets you upload documents (PDF, DOC/DOCX, TXT), extracts their text in the browser, and asks questions powered by OpenAI latest GPT‑5 model. Answers are grounded to the uploaded document content and include clear fallback behavior when the answer isn't in the file.

<img width="1916" height="1110" alt="Screenshot 2025-08-25 at 03 55 33" src="https://github.com/user-attachments/assets/c001226a-5b90-4c65-8568-2761ef830dce" />

## 🚀 Quick Start

### Clone and Run

```bash
# Clone the repository
git clone https://github.com/EniolaAdemola/DocuChat.git
cd DocuChat

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open the Local URL printed by Vite.

### Configure OpenAI API key

In the app UI, open "API Key Settings" and paste your key. It's stored in localStorage under `openai-api-key`.DocuChat – Document Q&A Assistant

DocuChat is an app that lets you upload documents (PDF, DOC/DOCX, TXT), extracts their text in the browser, and asks questions powered by OpenAI latest GPT‑5 model. Answers are grounded to the uploaded document content and include clear fallback behavior when the answer isn’t in the file.

### Features

- Upload documents with progress feedback (sidebar shows status and size)
- In‑browser PDF text extraction via pdfjs-dist (first 10 pages by default)
- GPT‑5 Q&A using the actual extracted content + full document metadata
- Honest “not found” response if the answer isn’t present in the document
- Conversation memory: includes the previous 5 Q&A for context
- Q&A ordering: newest questions appear at the bottom

### Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn‑ui
- OpenAI SDK (browser) for GPT‑5
- pdfjs-dist for PDF parsing in the browser

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An OpenAI API key

### Install & Run

```bash
npm install
npm run dev
```

Open the Local URL printed by Vite.

### Configure OpenAI API key

In the app UI, open “API Key Settings” and paste your key. It’s stored in localStorage under `openai-api-key`.

---

## Usage

1. Upload a document from the sidebar (supports .pdf, .doc, .docx, .txt).
2. Once status shows “ready”, select the document and ask a question.
3. The model will answer strictly from the document content + metadata. If it can’t find the answer, it will respond with: “I couldn't find that information in the document.”
4. New questions are appended at the bottom; search/filter is available.

---

## Project Structure

- `src/components/DocumentUpload.tsx` – Upload UI and UX
- `src/components/DocumentSidebar.tsx` – Document list, selection, delete
- `src/components/QAInterface.tsx` – Ask questions and view history
- `src/hooks/useDocuments.ts` – Core logic: upload simulation, content extraction, GPT calls, history
- `src/types/index.ts` – App types (`Document`, `QAItem`, etc.)

Key logic lives in `useDocuments.ts`:

- `simulateUpload(file)` – adds a document, extracts content, simulates progress, then marks `ready` and resolves
- `askQuestion(question, documentId)` – builds a prompt with metadata + content and sends to GPT‑5, including the previous 5 Q&A for context. Appends the new QA to the end of history.

---

## PDF Extraction Details

I used `pdfjs-dist` and wire a real Worker for Vite builds:

- Worker import: `pdfjs-dist/build/pdf.worker.min.mjs?worker`
- Bound via `pdfjsLib.GlobalWorkerOptions.workerPort`
- Extracts text for up to the first 10 pages to keep it fast; a note is added if the PDF is longer.

Limitations:

- Scanned/image‑only PDFs won’t yield text (no OCR). i also provide a readable fallback if possible, otherwise an explanatory message.

---

## Prompting & Model

- Model: `gpt-5`
- System prompt enforces grounding to the provided content and metadata
- If answer isn’t in the doc: returns exactly “I couldn't find that information in the document.”

---

## Troubleshooting

### PDF worker “fake worker”/CDN errors

This project avoids CDN worker issues by importing the worker as a Vite worker module and attaching it via `workerPort`. If you see worker errors:

- Hard refresh the page (Cmd+Shift+R)
- Ensure `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` exists
- Delete `node_modules` and reinstall if resolution issues persist

### Upload stays on “Uploading…”

`simulateUpload` now resolves the promise exactly when progress hits 100 and updates the document status to `ready`. Ensure your caller awaits `simulateUpload(file)` before clearing any local uploading state.

### GPT errors: “Please add your OpenAI API key first”

Open “API Key Settings” and add your key. It’s read from localStorage.

---

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build
- `npm run lint` – Lint

---

---

## 👨‍💻 Built with ❤️ by

**[EniolaAdemola](https://github.com/EniolaAdemola)**

---
