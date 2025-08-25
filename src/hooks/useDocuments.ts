import { useState, useCallback } from "react";
import { Document, QAItem, UploadProgress } from "../types";
import { toast } from "@/hooks/use-toast";
import OpenAI from "openai";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - Vite provides a Worker constructor via ?worker
import PdfJsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

// Wire a real worker instance to avoid fake-worker issues
if (typeof window !== "undefined") {
  // @ts-ignore new worker from Vite
  const worker = new PdfJsWorker();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjsLib as any).GlobalWorkerOptions.workerPort = worker;
}

// Utility: extract text from uploaded files with robust fallbacks
const extractFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;

          // helper to extract text from pdf
          const extractFromPdf = async (pdf: any) => {
            let fullText = "";
            const maxPages = Math.min(pdf.numPages, 10);
            for (let i = 1; i <= maxPages; i++) {
              try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str || "")
                  .join(" ");
                fullText += `Page ${i}:\n${pageText}\n\n`;
              } catch (pageError) {
                console.warn(`Error extracting page ${i}:`, pageError);
                fullText += `Page ${i}: [Error extracting text from this page]\n\n`;
              }
            }
            if (pdf.numPages > 10) {
              fullText += `\n[Note: Only first 10 pages extracted. Full document has ${pdf.numPages} pages.]\n`;
            }
            return fullText.trim();
          };

          // attempt 1: normal worker
          try {
            const task = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await task.promise;
            const text = await extractFromPdf(pdf);
            resolve(
              text ||
                `[PDF Content] - File: ${file.name}
Unable to extract readable text from this PDF. The file may contain images, be scanned, or be password protected.
File size: ${file.size} bytes, uploaded on ${new Date().toISOString()}`
            );
            return;
          } catch (firstErr) {
            console.warn(
              "PDF worker attempt failed; will try fallback:",
              firstErr
            );
          }

          // attempt 2: reattempt with existing workerPort config
          try {
            const task2 = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf2 = await task2.promise;
            const text2 = await extractFromPdf(pdf2);
            resolve(
              text2 ||
                `[PDF Content] - File: ${file.name}
Unable to extract readable text from this PDF. The file may contain images, be scanned, or be password protected.
File size: ${file.size} bytes, uploaded on ${new Date().toISOString()}`
            );
            return;
          } catch (secondErr) {
            console.error("PDF parsing failed in second attempt:", secondErr);
          }

          // fall through to plain-text fallback
          throw new Error("PDF parsing failed");
        } catch (error) {
          console.error("PDF parsing error:", error);
          // Fallback: try to get some readable text from binary
          try {
            const textReader = new FileReader();
            textReader.onload = (textEvent) => {
              const textResult = textEvent.target?.result as string;
              const readableText = textResult
                .replace(/[^\x20-\x7E\n\r\t]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

              if (readableText.length > 100) {
                resolve(
                  `[PDF Content - Text Extraction] - File: ${file.name}
Note: Advanced PDF parsing failed, using basic text extraction.

Extracted Text (may contain formatting artifacts):
${readableText.substring(0, 2000)}...

File size: ${file.size} bytes, uploaded on ${new Date().toISOString()}`
                );
              } else {
                resolve(
                  `[PDF Content] - File: ${file.name}
Error extracting text from PDF: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }
File size: ${file.size} bytes, uploaded on ${new Date().toISOString()}

Note: This PDF file was uploaded successfully but text extraction failed. This could be due to:
- The PDF contains scanned images instead of selectable text
- The PDF is password protected
- Technical limitations with PDF parsing in the browser
You can still ask questions about the document using the filename and metadata.`
                );
              }
            };
            textReader.readAsText(file);
          } catch (fallbackError) {
            resolve(
              `[PDF Content] - File: ${file.name}
Error extracting text from PDF: ${(error as Error)?.message || "Unknown error"}
File size: ${file.size} bytes, uploaded on ${new Date().toISOString()}

Note: This PDF file was uploaded successfully but text extraction failed. This could be due to:
- The PDF contains scanned images instead of selectable text
- The PDF is password protected
- Technical limitations with PDF parsing in the browser
You can still ask questions about the document using the filename and metadata.`
            );
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle text-based files
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          resolve(result);
        } else if (
          file.type.includes("text/") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".csv")
        ) {
          resolve(result);
        } else {
          resolve(
            `[${file.type}] - File: ${file.name}
This file type requires specialized parsing to extract text content.
Current file info: ${file.size} bytes, uploaded on ${new Date().toISOString()}`
          );
        }
      };
      reader.onerror = () =>
        reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    }
  });
};

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "1",
    name: "Product Requirements.pdf",
    size: 2048000,
    type: "application/pdf",
    uploadDate: new Date("2025-08-23"),
    status: "ready",
  },
  {
    id: "2",
    name: "Technical Specification.docx",
    size: 1536000,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadDate: new Date("2025-08-23"),
    status: "ready",
  },
];

const MOCK_QA_HISTORY: QAItem[] = [
  {
    id: "1",
    question: "What are the main features mentioned in this document?",
    answer:
      "The document outlines several key features including user authentication, real-time collaboration, document versioning, and advanced search capabilities. These features are designed to enhance productivity and streamline workflow management.",
    timestamp: new Date("2025-08-23T10:30:00"),
    documentId: "1",
  },
  {
    id: "2",
    question: "What is the timeline for implementation?",
    answer:
      "The implementation is planned across three phases: Phase 1 (Months 1-2) focuses on core infrastructure, Phase 2 (Months 3-4) adds collaborative features, and Phase 3 (Months 5-6) implements advanced analytics and reporting.",
    timestamp: new Date("2025-08-23T11:15:00"),
    documentId: "1",
  },
];

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [qaHistory, setQaHistory] = useState<QAItem[]>(MOCK_QA_HISTORY);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(
    MOCK_DOCUMENTS[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  // Ensure the upload resolves when complete and status flips to ready
  const simulateUpload = useCallback((file: File): Promise<Document> => {
    return new Promise(async (resolve, reject) => {
      const newDocument: Document = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        status: "uploading",
        progress: 0,
        file: file, // Store the original file
      };

      setDocuments((prev) => [...prev, newDocument]);

      try {
        // Extract file content
        console.log("Starting content extraction for:", file.name);
        const content = await extractFileContent(file);
        console.log("Content extracted, length:", content.length);
        console.log("Content preview:", content.substring(0, 200) + "...");

        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            const completedDocument: Document = {
              ...newDocument,
              status: "ready" as const,
              progress: 100,
              content: content, // Store the extracted content
            };

            console.log("Upload completed for document:", {
              id: completedDocument.id,
              name: completedDocument.name,
              type: completedDocument.type,
              size: completedDocument.size,
              status: completedDocument.status,
              hasContent: !!completedDocument.content,
              contentLength: completedDocument.content?.length || 0,
              contentPreview: completedDocument.content
                ? completedDocument.content.substring(0, 100) + "..."
                : "No content",
            });

            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === newDocument.id ? completedDocument : doc
              )
            );

            toast({
              title: "Upload complete",
              description: `${file.name} has been successfully uploaded and processed.`,
            });

            resolve(completedDocument);
          } else {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === newDocument.id ? { ...doc, progress } : doc
              )
            );
          }
        }, 200);
      } catch (error) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDocument.id
              ? { ...doc, status: "error" as const }
              : doc
          )
        );

        toast({
          title: "Upload failed",
          description: `Failed to process ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });

        reject(error);
      }
    });
  }, []);

  const askQuestion = useCallback(
    async (question: string, documentId: string): Promise<QAItem> => {
      if (!question.trim()) {
        throw new Error("Question cannot be empty");
      }

      const apiKey = localStorage.getItem("openai-api-key");
      if (!apiKey) {
        throw new Error("Please add your OpenAI API key first");
      }

      setIsLoading(true);

      try {
        const document = documents.find((doc) => doc.id === documentId);
        if (!document) {
          throw new Error("Document not found");
        }

        console.log("Found document for Q&A:", {
          id: document.id,
          name: document.name,
          type: document.type,
          size: document.size,
          status: document.status,
          hasContent: !!document.content,
          contentLength: document.content?.length || 0,
          uploadDate: document.uploadDate,
        });

        const openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true,
        });

        // Use actual document content or fallback to simulated content
        const documentContent =
          document.content ||
          `Document Content Preview for ${document.name} (simulated)

This is placeholder content for ${document.name}. In a real implementation, the app will extract and parse the actual document text here. The document likely contains information about project requirements, specifications, and implementation details.

Potential topics covered:
- User authentication and authorization
- Database design and architecture
- API development and integration
- Frontend UI/UX
- Testing strategies
- Deployment & maintenance procedures`;

        // Include all available document metadata and file details
        const documentDetails = {
          id: document.id,
          name: document.name,
          type: document.type,
          size: document.size,
          uploadDate: document.uploadDate,
          status: document.status,
          progress: document.progress ?? undefined,
          hasContent: !!document.content,
          contentPreview: document.content
            ? document.content.substring(0, 200) + "..."
            : "No content extracted",
        };

        console.log(
          "Document Details:",
          JSON.stringify(documentDetails, null, 2)
        );
        console.log("Document Content Length:", document.content?.length || 0);

        // Build conversation context: include up to the previous 5 Q&A for this document
        const previousQAs = qaHistory
          .filter((qa) => qa.documentId === documentId)
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        const lastFive = previousQAs.slice(-5);

        const historyMessages = lastFive.flatMap((qa) => [
          { role: "user" as const, content: `Previous Q: ${qa.question}` },
          { role: "assistant" as const, content: `Previous A: ${qa.answer}` },
        ]);

        const completion = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful document analysis assistant. Your task is to answer questions based solely on the provided document content and metadata. If the information requested is not available in the document, clearly state that you couldn't find that information in the document.",
            },
            ...historyMessages,
            {
              role: "user",
              content: `Document Metadata:
${JSON.stringify(documentDetails, null, 2)}

Document Content:
${documentContent}

User Question: ${question}

Instructions:
- Answer the question based ONLY on the document content and metadata provided above
- If the answer cannot be found in the document, respond with: "I couldn't find that information in the document."
- If you can partially answer based on available information, state what you know and what's missing
- Provide specific quotes or references from the document when possible
- Keep your response concise and focused (2-4 sentences)
- Include relevant details from the document metadata if they help answer the question`,
            },
          ],
        });

        const answer =
          completion.choices[0]?.message?.content?.trim() ||
          "I couldn't find that information in the document.";

        const newQA: QAItem = {
          id: Math.random().toString(36).substr(2, 9),
          question,
          answer,
          timestamp: new Date(),
          documentId,
        };

        // Append new item to the end so newest appears at the bottom
        setQaHistory((prev) => [...prev, newQA]);
        setIsLoading(false);

        return newQA;
      } catch (error) {
        setIsLoading(false);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get AI response";

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });

        throw error;
      }
    },
    [documents, qaHistory]
  );

  const searchQA = useCallback(
    (query: string): QAItem[] => {
      if (!query.trim()) return qaHistory;

      const lowercaseQuery = query.toLowerCase();
      return qaHistory.filter(
        (qa) =>
          qa.question.toLowerCase().includes(lowercaseQuery) ||
          qa.answer.toLowerCase().includes(lowercaseQuery)
      );
    },
    [qaHistory]
  );

  const deleteDocument = useCallback(
    (documentId: string) => {
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setQaHistory((prev) => prev.filter((qa) => qa.documentId !== documentId));

      if (currentDocument?.id === documentId) {
        setCurrentDocument(
          documents.find((doc) => doc.id !== documentId) || null
        );
      }

      toast({
        title: "Document deleted",
        description: "The document and its Q&A history have been removed.",
      });
    },
    [currentDocument, documents]
  );

  return {
    documents,
    qaHistory: currentDocument
      ? qaHistory.filter((qa) => qa.documentId === currentDocument.id)
      : [],
    allQaHistory: qaHistory,
    currentDocument,
    isLoading,
    setCurrentDocument,
    simulateUpload,
    askQuestion,
    searchQA,
    deleteDocument,
  };
};
