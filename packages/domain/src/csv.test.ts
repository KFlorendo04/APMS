import { describe, expect, it } from 'vitest';
import { parseCsv, validateCsvRows } from './csv';

describe('CSV import', () => {
  it('parses quoted values and preserves empty cells', () => {
    expect(parseCsv('student_id,name,score\nS-1,"Santos, Mika",95\nS-2,Liam,')).toEqual([
      { student_id: 'S-1', name: 'Santos, Mika', score: '95' },
      { student_id: 'S-2', name: 'Liam', score: '' },
    ]);
  });

  it('reports invalid and duplicate rows before import', () => {
    const results = validateCsvRows(parseCsv('student_id,score\nS-1,90\nS-1,101\nS-2,'), (row) => {
      const score = Number(row.score);
      const errors = !row.score || !Number.isFinite(score) || score < 0 || score > 100 ? ['Invalid score'] : [];
      return { value: errors.length ? undefined : { id: row.student_id, score }, errors, duplicateKey: row.student_id };
    });
    expect(results[1]).toMatchObject({ duplicate: true, errors: ['Invalid score', 'Duplicate row'] });
    expect(results[2].errors).toContain('Invalid score');
  });

  it('rejects malformed headers and unterminated quotes', () => {
    expect(() => parseCsv('id,id\n1,2')).toThrow(/unique/);
    expect(() => parseCsv('id,name\n1,"Mika')).toThrow(/unterminated/);
  });
});
