/**
 * Modulo function that handles negative numbers correctly
 * @param {number} n - The dividend
 * @param {number} m - The divisor
 * @returns {number} The modulo result
 */
export const mod = (n, m) => ((n % m) + m) % m;
