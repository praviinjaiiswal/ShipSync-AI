import type { EsanchitValidationResult } from './canonical-types';
import { ESANCHIT_DOC_CODES } from '@/lib/customs/adapters/esanchit-adapter';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB statutory ICEGATE limit

export interface ValidateEsanchitDocumentInput {
  docTypeCode: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Validates a supporting document against official CBIC ICEGATE e-Sanchit statutory regulations.
 */
export function validateForEsanchit(input: ValidateEsanchitDocumentInput): EsanchitValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { docTypeCode, fileName, fileSize, mimeType } = input;

  // 1. Validate Document Type Code
  const docTypeName = ESANCHIT_DOC_CODES[docTypeCode];
  if (!docTypeName) {
    errors.push(
      `Invalid e-Sanchit Document Type Code: "${docTypeCode}". Must match statutory CBIC codes (e.g., 010001 Commercial Invoice).`
    );
  }

  // 2. Format / MIME Type (Strict PDF/A or PDF requirement)
  if (mimeType !== 'application/pdf') {
    errors.push(`Statutory format violation: e-Sanchit strictly mandates PDF format. Received: ${mimeType}`);
  }

  // 3. File Size (Maximum 5MB)
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(2);
    errors.push(`File size (${sizeMb} MB) exceeds official 5MB e-Sanchit ceiling.`);
  } else if (fileSize < 500) {
    warnings.push('File size is unusually small (< 500 bytes). Ensure document is not corrupt or blank.');
  }

  // 4. File Name convention check
  if (fileName.length > 50) {
    warnings.push('File name exceeds recommended 50 characters. ICEGATE may truncate lengthy names.');
  }
  if (/[^a-zA-Z0-9._-]/.test(fileName)) {
    warnings.push('File name contains spaces or special characters. Use only alphanumeric characters, underscores, or hyphens.');
  }

  return {
    ready: errors.length === 0,
    docTypeCode,
    docTypeName: docTypeName || 'UNKNOWN_CODE',
    fileSize,
    mimeType,
    errors,
    warnings,
  };
}
