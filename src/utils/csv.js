/**
 * CSV export helpers.
 *
 * Two concerns are handled here:
 *
 * 1. CSV injection ("formula injection"): a value that starts with = + - @ or a
 *    control char can be executed as a formula when the file is opened in Excel /
 *    Google Sheets / LibreOffice (e.g. =HYPERLINK(...), =cmd|...). We neutralize
 *    those by prefixing a single quote, which spreadsheets treat as "literal text".
 * 2. RFC-4180 quoting: fields containing a comma, quote or newline are wrapped in
 *    double quotes with embedded quotes doubled, so columns never break.
 */

const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

/** Make a single value safe to place in a CSV cell. */
export function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Neutralize formula injection.
  if (str.length > 0 && FORMULA_TRIGGERS.includes(str[0])) {
    str = `'${str}`;
  }

  // RFC-4180 quoting.
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from a header row and an array of row arrays.
 * @param {string[]} headers
 * @param {Array<Array<*>>} rows
 * @returns {string}
 */
export function buildCsv(headers, rows) {
  const lines = [headers.map(sanitizeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(sanitizeCell).join(','));
  }
  // Prepend a UTF-8 BOM so Excel reads accents (é, ü, ‰) correctly.
  return '﻿' + lines.join('\r\n');
}

/**
 * Trigger a browser download of CSV content.
 * @param {string} filename base name without date/extension
 * @param {string} csv
 */
export function downloadCsv(filename, csv) {
  const stamp = new Date().toISOString().split('T')[0];
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Convenience: build + download in one call. */
export function exportCsv(filename, headers, rows) {
  downloadCsv(filename, buildCsv(headers, rows));
}
