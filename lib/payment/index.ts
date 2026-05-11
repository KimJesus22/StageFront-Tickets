// Re-export public API — Types and Classes
export { PaymentStrategy } from "./PaymentStrategy";
export type {
  SeatData,
  PaymentFormData,
  PaymentResult,
  PaymentRequest,
} from "./PaymentStrategy";
export { MockPaymentStrategy } from "./MockPaymentStrategy";
export { StripeStrategy } from "./StripeStrategy";
export { processCheckoutInternal } from "./PaymentContext";

// Note: For client components, use the server action:
//   import { processCheckout } from '@/lib/actions/payment';
