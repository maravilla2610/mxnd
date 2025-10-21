/**
 * Format a bigint balance to a human-readable string with proper decimals
 * @param balance - The raw balance as bigint
 * @param decimals - Number of decimal places (default: 18 for native tokens)
 * @returns Formatted balance string with trailing zeros removed
 *
 * @example
 * formatBalance(240778021342637n, 18) // "0.000240778021342637"
 * formatBalance(1000000000000000000n, 18) // "1"
 * formatBalance(1500000000000000000n, 18) // "1.5"
 */
export function formatBalance(balance: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = balance / divisor;
  const fractionalPart = balance % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');

  // Remove trailing zeros
  const trimmedFractional = fractionalStr.replace(/0+$/, '');

  return trimmedFractional ? `${integerPart}.${trimmedFractional}` : integerPart.toString();
}
