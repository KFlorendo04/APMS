export type ReportRow = { percentage: number; riskLevel: 'low' | 'medium' | 'high' };
export function summarizeReport(rows: readonly ReportRow[]) {
  const count = rows.length;
  const average = count ? rows.reduce((total, row) => total + row.percentage, 0) / count : 0;
  return {
    count,
    average: Number(average.toFixed(2)),
    lowRisk: rows.filter((row) => row.riskLevel === 'low').length,
    mediumRisk: rows.filter((row) => row.riskLevel === 'medium').length,
    highRisk: rows.filter((row) => row.riskLevel === 'high').length,
  };
}
