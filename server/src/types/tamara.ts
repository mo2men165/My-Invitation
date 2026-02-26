// server/src/types/tamara.ts

export interface TamaraAmount {
  amount: number;
  currency: 'SAR';
}

export interface TamaraItem {
  name: string;
  type: 'Digital' | 'Physical';
  reference_id: string;
  sku: string;
  quantity: number;
  discount_amount: TamaraAmount;
  tax_amount: TamaraAmount;
  unit_price: TamaraAmount;
  total_amount: TamaraAmount;
}

export interface TamaraConsumer {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface TamaraAddress {
  city: string;
  country_code: 'SA';
  first_name: string;
  last_name: string;
  line1: string;
  phone_number: string;
  region: string;
}

export interface TamaraMerchantUrl {
  cancel: string;
  failure: string;
  success: string;
  notification: string;
}

export interface TamaraCheckoutRequest {
  total_amount: TamaraAmount;
  shipping_amount: TamaraAmount;
  tax_amount: TamaraAmount;
  order_reference_id: string;
  order_number: string;
  items: TamaraItem[];
  consumer: TamaraConsumer;
  country_code: 'SA';
  description: string;
  merchant_url: TamaraMerchantUrl;
  payment_type: 'PAY_BY_INSTALMENTS';
  instalments: number;
  billing_address: TamaraAddress;
  locale: string;
  is_mobile: boolean;
  platform: 'web' | 'mobile';
}

export interface TamaraCheckoutResponse {
  order_id: string;
  checkout_id: string;
  checkout_url: string;
  status: string;
}

export interface TamaraAuthoriseResponse {
  order_id: string;
  status: 'authorised' | 'fully_captured' | 'approved' | 'declined';
  capture_id?: string;
  authorized_amount?: TamaraAmount;
  auto_captured?: boolean;
}

export interface TamaraCaptureRequest {
  order_id: string;
  total_amount: TamaraAmount;
  items: TamaraItem[];
  shipping_amount: TamaraAmount;
  tax_amount: TamaraAmount;
  discount_amount: TamaraAmount;
}

export interface TamaraCaptureResponse {
  capture_id: string;
  order_id: string;
  status: 'fully_captured' | 'partially_captured';
  captured_amount?: TamaraAmount;
}

export interface TamaraCancelRequest {
  total_amount: TamaraAmount;
  shipping_amount: TamaraAmount;
  tax_amount: TamaraAmount;
  discount_amount: TamaraAmount;
  items: TamaraItem[];
}

export interface TamaraCancelResponse {
  cancel_id: string;
  order_id: string;
  status: 'canceled' | 'updated';
  canceled_amount?: TamaraAmount;
}

export interface TamaraRefundRequest {
  total_amount: TamaraAmount;
  comment: string;
}

export interface TamaraRefundResponse {
  refund_id: string;
  order_id: string;
  status: 'fully_refunded' | 'partially_refunded';
  refunded_amount?: TamaraAmount;
}

export interface TamaraOrderDetails {
  order_id: string;
  order_reference_id: string;
  status: TamaraOrderStatus;
  total_amount: TamaraAmount;
  captured_amount?: TamaraAmount;
  refunded_amount?: TamaraAmount;
  canceled_amount?: TamaraAmount;
  consumer: TamaraConsumer;
  items: TamaraItem[];
  created_at: string;
  updated_at: string;
}

export type TamaraOrderStatus = 
  | 'new'
  | 'approved'
  | 'authorised'
  | 'fully_captured'
  | 'partially_captured'
  | 'fully_refunded'
  | 'partially_refunded'
  | 'canceled'
  | 'declined'
  | 'expired';

export type TamaraWebhookEventType =
  | 'order_approved'
  | 'order_expired'
  | 'order_declined'
  | 'order_authorised'
  | 'order_captured';

export interface TamaraWebhookPayload {
  event_type: TamaraWebhookEventType;
  order_id: string;
  order_reference_id: string;
  data?: {
    order_id?: string;
    status?: string;
    capture_id?: string;
    [key: string]: any;
  };
}

export interface TamaraConfig {
  apiToken: string;
  notificationToken: string;
  publicKey: string;
  apiUrl: string;
  frontendUrl: string;
  backendUrl: string;
}

export interface TamaraErrorResponse {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
