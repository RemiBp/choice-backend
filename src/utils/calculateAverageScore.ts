/**
 * Calculates the average of numeric values in a given object.
 * Ignores undefined or non-number values.
 *
 * @param values - An object where each value may be a number or undefined
 * @returns The average of all defined numbers, rounded to 2 decimal places
 */
export function calculateAverageScore(values: Record<string, number | undefined>): number {
  const scores = Object.values(values).filter((v): v is number => typeof v === 'number');
  if (!scores.length) return 0;

  const total = scores.reduce((a, b) => a + b, 0);
  const average = total / scores.length;

  return parseFloat(average.toFixed(2));
}
