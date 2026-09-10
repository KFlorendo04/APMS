export type CsvImportRow = Record<string, string>;
export type CsvValidationResult<T> = {
  rowNumber: number;
  raw: CsvImportRow;
  value?: T;
  errors: string[];
  duplicate: boolean;
};

export function parseCsv(text: string): CsvImportRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { value += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(value.trim()); value = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim()); value = '';
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
      continue;
    }
    value += char;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted value.');
  row.push(value.trim());
  if (row.some((cell) => cell.length)) rows.push(row);
  const [headers, ...data] = rows;
  if (!headers?.length || headers.some((header) => !header)) throw new Error('CSV requires a non-empty header row.');
  if (new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) throw new Error('CSV headers must be unique.');
  return data.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}

export function validateCsvRows<T>(
  rows: CsvImportRow[],
  validate: (row: CsvImportRow) => { value?: T; errors: string[]; duplicateKey?: string },
): CsvValidationResult<T>[] {
  const seen = new Set<string>();
  return rows.map((raw, index) => {
    const result = validate(raw);
    const duplicate = Boolean(result.duplicateKey && seen.has(result.duplicateKey));
    if (result.duplicateKey) seen.add(result.duplicateKey);
    return { rowNumber: index + 2, raw, value: result.value, errors: duplicate ? [...result.errors, 'Duplicate row'] : result.errors, duplicate };
  });
}
