/**
 * Payment Deep Link Helper Functions
 * Generates deep links for payment apps (Toss, PayPal)
 */

/**
 * Generate Toss payment deep link
 * @param amount - Amount in KRW
 * @param bankName - Bank name (e.g., "KB", "신한")
 * @param accountNo - Account number
 * @returns Toss deep link URL
 */
export function generateTossLink(
  amount: number,
  bankName: string,
  accountNo: string
): string {
  if (!bankName || !accountNo) {
    throw new Error('Bank name and account number are required for Toss payment');
  }

  const encodedBank = encodeURIComponent(bankName);
  const encodedAccount = encodeURIComponent(accountNo);

  return `supertoss://send?amount=${amount}&bank=${encodedBank}&accountNo=${encodedAccount}`;
}

/**
 * Generate PayPal payment deep link
 * @param amount - Amount in USD or local currency
 * @param paypalId - PayPal ID or username
 * @returns PayPal deep link URL
 */
export function generatePayPalLink(
  amount: number,
  paypalId: string
): string {
  if (!paypalId) {
    throw new Error('PayPal ID is required for PayPal payment');
  }

  const encodedId = encodeURIComponent(paypalId);

  return `https://paypal.me/${encodedId}/${amount}`;
}

/**
 * Calculate per-person split amount
 * @param totalAmount - Total amount to split
 * @param memberCount - Number of members
 * @returns Amount per person (rounded up)
 */
export function calculateSplitAmount(
  totalAmount: number,
  memberCount: number
): number {
  if (memberCount <= 0) {
    throw new Error('Member count must be greater than 0');
  }

  return Math.ceil(totalAmount / memberCount);
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: KRW)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KRW'
): string {
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString('ko-KR')}`;
  }

  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
