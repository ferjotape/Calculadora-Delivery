/** Média dos meses preenchidos em monthly_revenue — meses vazios não entram na conta. */
export function computeAverageMonthlyRevenue(rows: { value: number }[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return total / rows.length;
}
