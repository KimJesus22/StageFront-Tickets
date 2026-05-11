"use server";

import { processCheckoutInternal } from "@/lib/payment/PaymentContext";
import type { SeatData, PaymentFormData, PaymentResult } from "@/lib/payment/PaymentStrategy";

/**
 * Server Action: processCheckout
 *
 * Thin wrapper that exposes processCheckoutInternal as a Next.js Server Action.
 * This is the only function the checkout page needs to import.
 */
export async function processCheckout(
  seats: SeatData[],
  eventId: string,
  formData: PaymentFormData
): Promise<PaymentResult> {
  return processCheckoutInternal(seats, eventId, formData);
}
