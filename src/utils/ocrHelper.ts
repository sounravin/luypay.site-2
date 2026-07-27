import { createWorker } from 'tesseract.js';

export interface ExtractedIdCardData {
  idCardNumber: string;
  name: string;
  dob: string;
  address: string;
  idExpiryDate: string;
  idExpiryStatus: 'valid' | 'expiring_soon' | 'expired';
  rawText?: string;
}

/**
 * Calculates ID expiry status relative to current date:
 * - 'expired': Expiry date is before today
 * - 'expiring_soon': Expiry date is within 30 days from today
 * - 'valid': Expiry date is more than 30 days in the future
 */
export function checkExpiryStatus(expiryDateStr: string): 'valid' | 'expiring_soon' | 'expired' {
  if (!expiryDateStr || expiryDateStr.trim() === '') return 'valid';

  try {
    const cleanStr = expiryDateStr.trim().replace(/\./g, '/').replace(/-/g, '/');
    const parts = cleanStr.split('/');
    let expiryDate: Date | null = null;

    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      if (parts[0].length === 4) {
        // YYYY/MM/DD
        expiryDate = new Date(p0, p1 - 1, p2);
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        expiryDate = new Date(p2, p1 - 1, p0);
      }
    }

    if (!expiryDate || isNaN(expiryDate.getTime())) {
      expiryDate = new Date(expiryDateStr);
    }

    if (isNaN(expiryDate.getTime())) return 'valid';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    if (expiryDate < today) {
      return 'expired';
    } else if (expiryDate <= thirtyDaysLater) {
      return 'expiring_soon';
    } else {
      return 'valid';
    }
  } catch (e) {
    console.error("Error parsing expiry date:", e);
    return 'valid';
  }
}

/**
 * Convert Khmer digits to Standard Western Arabic digits
 */
function convertKhmerNumerals(str: string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return str.replace(/[០-៩]/g, (w) => khmerDigits.indexOf(w).toString());
}

/**
 * Scan National ID Card Image using Tesseract OCR & smart Khmer pattern matcher
 */
export async function scanIdCardImage(imageDataUrl: string): Promise<ExtractedIdCardData> {
  // 1. Try AI-powered Gemini Vision OCR via server API
  try {
    const apiRes = await fetch('/api/scan-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && (data.idCardNumber || data.name || data.dob || data.address || data.idExpiryDate)) {
        const idCardNum = (data.idCardNumber || '').toString().trim();
        const nameVal = (data.name || '').trim();
        const dobVal = (data.dob || '').trim();
        const addressVal = (data.address || '').trim();
        const expiryVal = (data.idExpiryDate || '').trim();
        const expiryStatus = checkExpiryStatus(expiryVal);

        return {
          idCardNumber: idCardNum,
          name: nameVal,
          dob: dobVal,
          address: addressVal,
          idExpiryDate: expiryVal,
          idExpiryStatus: expiryStatus,
          rawText: JSON.stringify(data)
        };
      }
    }
  } catch (apiErr) {
    console.warn("Server OCR API call skipped/failed, falling back to client OCR:", apiErr);
  }

  // 2. Fallback to Tesseract OCR & smart pattern matching
  let rawText = '';
  try {
    const worker = await createWorker('eng');
    const ret = await worker.recognize(imageDataUrl);
    rawText = ret.data.text || '';
    await worker.terminate();
  } catch (err) {
    console.warn("Tesseract OCR fallback triggered:", err);
  }

  // Convert Khmer numerals to western numerals if present
  const text = convertKhmerNumerals(rawText);

  // 1. Extract 9 or 10 digit ID Card Number
  let idCardNumber = '';
  const idMatches = text.match(/\b\d{9,10}\b/g) || text.match(/\b\d{3}[-.\s]\d{3}[-.\s]\d{3,4}\b/g);
  if (idMatches && idMatches.length > 0) {
    idCardNumber = idMatches[0].replace(/[-.\s]/g, '');
  }

  // 2. Extract Dates (DOB and Expiry)
  const dateRegex = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/g;
  const foundDates = text.match(dateRegex) || [];

  let dob = '';
  let idExpiryDate = '';

  if (foundDates.length >= 2) {
    // Usually the earlier date is DOB, later is Expiry
    foundDates.sort((a: string, b: string) => {
      const yearA = parseInt(a.match(/\d{4}/)?.[0] || '2000', 10);
      const yearB = parseInt(b.match(/\d{4}/)?.[0] || '2000', 10);
      return yearA - yearB;
    });
    dob = foundDates[0].replace(/\//g, '.').replace(/-/g, '.');
    idExpiryDate = foundDates[foundDates.length - 1].replace(/\//g, '.').replace(/-/g, '.');
  } else if (foundDates.length === 1) {
    const year = parseInt(foundDates[0].match(/\d{4}/)?.[0] || '2000', 10);
    if (year < 2015) {
      dob = foundDates[0].replace(/\//g, '.').replace(/-/g, '.');
    } else {
      idExpiryDate = foundDates[0].replace(/\//g, '.').replace(/-/g, '.');
    }
  }

  // 3. Extract Name heuristic
  let name = '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    if (/NAME|Full Name|Name|Khmer/i.test(line)) {
      const clean = line.replace(/NAME|Full Name|Name|Khmer|:/gi, '').trim();
      if (clean.length > 2) {
        name = clean;
        break;
      }
    }
  }

  // 4. Extract Address heuristic
  let address = '';
  for (const line of lines) {
    if (/ADDRESS|Address|ភូមិ|សង្កាត់|ឃុំ|ស្រុក|ខណ្ឌ|ក្រុង|ខេត្ត/i.test(line)) {
      const clean = line.replace(/ADDRESS|Address|:/gi, '').trim();
      if (clean.length > 3) {
        address = clean;
        break;
      }
    }
  }

  // Expiry Status Calculation
  const idExpiryStatus = checkExpiryStatus(idExpiryDate);

  return {
    idCardNumber: idCardNumber,
    name: name,
    dob: dob,
    address: address,
    idExpiryDate: idExpiryDate,
    idExpiryStatus: idExpiryStatus,
    rawText: rawText
  };
}
