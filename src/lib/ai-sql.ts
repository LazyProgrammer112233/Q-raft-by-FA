import type { SqlGeneration } from '../store/useAppStore';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Use local worker via Vite to avoid CDN fetch issues
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROMPT = `
You are an Expert Data Engineer specializing in multi-dialect SQL optimization.
You will analyze the following business requirement document and extract ALL required analytical tasks.

For EACH task you detect, you MUST generate the EXACT SQL query for three different dialects: 
1. ClickHouse
2. Trino
3. PostgreSQL

CRITICAL RULE: The three queries you generate MUST NOT BE IDENTICAL. You are strictly forbidden from using generic ANSI SQL that works on all three. You must use the most highly-optimized, engine-specific syntax for each.

You MUST enforce these SQL differences:
- ClickHouse: 
  - MUST use \`toStartOfMonth()\`, \`toStartOfWeek()\` for date truncation.
  - MUST use \`uniqExact()\` instead of \`COUNT(DISTINCT)\` when applicable.
  - MUST use \`argMax()\` or \`argMin()\` instead of window functions where possible.
  - Use \`toUInt32()\` or \`toString()\` for explicit casting.
  - Arrays use \`[1, 2, 3]\` and functions like \`arrayJoin()\`.
- Trino: 
  - MUST use \`date_trunc('month', date_col)\`.
  - MUST use \`approx_distinct()\` for large distinct counts.
  - MUST use \`max_by()\` or \`min_by()\`.
  - Strictly use \`CAST(col AS varchar)\` or \`CAST(col AS integer)\`. Do NOT use \`::\` shorthand.
- Postgres: 
  - MUST use \`DATE_TRUNC('month', date_col)\`.
  - MUST use \`STRING_AGG()\` for string concatenation aggregations.
  - Use Postgres specific shorthand casting like \`col::VARCHAR\` or \`col::INT\`.
  - Window functions \`OVER (PARTITION BY ...)\` are preferred here over array functions.

IMPORTANT: Because you are returning a JSON payload, you MUST properly escape all newlines ('\\n') and quotes ('\\"') inside the JSON string values. DO NOT include raw/unescaped newlines or control characters that would break JSON.parse().

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

  const apiKey = import.meta.env.VITE_GROQ_AUTH_TOKEN;

  // DEBUG VERCEL DEPLOYMENT: Log the state of the API key
  console.log("DEBUG: VITE_GROQ_AUTH_TOKEN Type: ", typeof apiKey);
  console.log("DEBUG: VITE_GROQ_AUTH_TOKEN Length: ", apiKey?.length || 'N/A');
  if (apiKey) {
    console.log("DEBUG: VITE_GROQ_AUTH_TOKEN Starts With: ", apiKey.substring(0, 4) + '...');
  } else {
    console.log("DEBUG: VITE_GROQ_AUTH_TOKEN is undefined or empty in this environment!");
  }

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
