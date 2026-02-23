import type { SqlGeneration } from '../store/useAppStore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Use local worker via Vite to avoid CDN fetch issues
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROMPT = `
You are an expert Data Engineer working for Field Assist.
You need to analyze the following business requirement document and extract ALL required analytical tasks.

For EACH task you detect, you MUST generate the EXACT SQL query for three different dialects: 
1. ClickHouse
2. Trino
3. PostgreSQL

You MUST enforce these SQL differences:
- ClickHouse: Uses specific date functions (toStartOfMonth, etc.), Array functions, and strict type casting.
- Trino: Presto/Trino syntax, strict typing, different date functions (date_trunc).
- Postgres: Standard PG syntax.

IMPORTANT: The SQL queries you write will naturally contain newlines and quotes. Because you are returning a JSON payload, you MUST properly escape all newlines ('\\n') and quotes ('\\"') inside the JSON string values. DO NOT include raw/unescaped newlines or control characters that would break JSON.parse().

Respond with ONLY a valid JSON array of objects. Do not include any markdown formatting (no \`\`\`json). The JSON must exactly match this structure:
[
  {
    "task_name": "Title of the task",
    "description": "Short explanation",
    "clickhouse_sql": "SELECT ...",
    "trino_sql": "SELECT ...",
    "postgres_sql": "SELECT ..."
  }
]
`;

async function extractTextFromBase64(base64: string, fileName: string): Promise<string> {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const fileExt = fileName.toLowerCase().split('.').pop() || '';

  if (fileExt === 'pdf') {
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText.trim();
  }

  if (fileExt === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    return result.value.trim();
  }

  // Fallback for .txt or other formats: decode as utf-8
  return new TextDecoder('utf-8').decode(bytes).trim();
}

export async function generateSqlGenerations(fileBufferBase64: string, fileName: string): Promise<SqlGeneration[]> {
  // Extract text client-side directly
  let extractedText = '';
  try {
    extractedText = await extractTextFromBase64(fileBufferBase64, fileName);
  } catch (err: any) {
    console.error("Failed to parse document text:", err);
    throw new Error(`Failed to extract text from document: ${err.message}`);
  }

  if (!extractedText) {
    throw new Error("No text could be extracted from the document.");
  }

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: PROMPT },
      { role: "user", content: `Please analyze the following document text and generate the SQL:\n\n${extractedText}` }
    ],
    temperature: 0.1
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(responseData));
    }

    const responseText = responseData.choices?.[0]?.message?.content || '[]';
    console.log("AI Response:", responseText);

    let jsonStr = responseText.trim();

    // Find the first '[' and last ']' to extract just the array
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    }

    // Sanitize JSON by removing unescaped newlines inside strings
    let sanitized = "";
    let inString = false;
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
        inString = !inString;
      }
      if (inString && (char === '\n' || char === '\r')) {
        sanitized += '\\n';
      } else if (inString && char === '\t') {
        sanitized += '\\t';
      } else {
        sanitized += char;
      }
    }

    return JSON.parse(sanitized) as SqlGeneration[];
  } catch (error: any) {
    console.error("Failed to generate SQL:", error);
    throw new Error(`Failed to process document and generate SQL. Details: ${error.message || String(error)}`);
  }
}
