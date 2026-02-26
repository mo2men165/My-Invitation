// server/src/types/tabby.ts

export interface TabbyBuyer {
  phone: string;
  email: string;
  name: string;
  dob?: string;
}

export interface TabbyBuyerHistory {
  registered_since: string;
  loyalty_level: number;
  wishlist_count: number;
  is_email_verified: boolean;
  is_phone_number_verified: boolean;
}

export interface TabbyItem {
  title: string;
  description: string;
  id: string;
  sku: string;
  category: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  reference_id: string;
  image_url?: string;
  product_url?: string;
}

export interface TabbyOrder {
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  updated_at: string;
  reference_id: string;
  items: TabbyItem[];
}

export interface TabbyOrderHistory {
  purchased_at: string;  // ISO 8601 datetime
  amount: string;
  payment_method: 'card' | 'cod';
  status: 'new' | 'processing' | 'complete' | 'refunded' | 'canceled' | 'unknown';
  buyer: TabbyBuyer;
  shipping_address: TabbyShippingAddress;
  items?: TabbyItem[];
}

export interface TabbyShippingAddress {
  city: string;
  address: string;
  zip: string;
}

export interface TabbyMeta {
  order_id: string;
  customer: string;
}

export interface TabbyAttachment {
  body: string;
  content_type: string;
}

export interface TabbyPayment {
  amount: string;
  currency: 'SAR' | 'AED' | 'KWD';
  description?: string;
  buyer: TabbyBuyer;
  buyer_history: TabbyBuyerHistory;
  order: TabbyOrder;
  order_history: TabbyOrderHistory[];  // Required per API spec
  shipping_address: TabbyShippingAddress;
  meta?: TabbyMeta;
  attachment?: TabbyAttachment;
}

export interface TabbyMerchantUrls {
  success: string;
  cancel: string;
  failure: string;
}

export interface TabbySessionRequest {
  payment: TabbyPayment;
  lang: string;
  merchant_code: string;
  merchant_urls: TabbyMerchantUrls;
}

export interface TabbyInstallmentProduct {
  payment_id: string;
  web_url: string;
  downpayment: string;
  amount_to_capture: string;
  installment_amount: string;
}

export interface TabbyProductConfig {
  installments?: TabbyInstallmentProduct[];
  rejection_reason?: string;
}

export interface TabbySessionConfiguration {
  available_products: TabbyProductConfig;
  products?: {
    installments?: {
      rejection_reason?: string;
    };
  };
}

export interface TabbySessionResponse {
  id: string;
  status: 'created' | 'rejected' | 'expired';
  configuration: TabbySessionConfiguration;
  payment: {
    id: string;
    amount: string;
    currency: string;
  };
}

export type TabbyPaymentStatus = 
  | 'AUTHORIZED'
  | 'CLOSED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CREATED';

export interface TabbyPaymentResponse {
  id: string;
  status: TabbyPaymentStatus;
  amount: string;
  currency: string;
  created_at: string;
  captures?: Array<{
    id: string;
    amount: string;
    created_at: string;
  }>;
  refunds?: Array<{
    id: string;
    amount: string;
    reason: string;
    created_at: string;
  }>;
}

export interface TabbyCaptureRequest {
  amount: string;
  reference_id: string;  // Required idempotency key
  tax_amount?: string;
  shipping_amount?: string;
  discount_amount?: string;
  items?: TabbyItem[];
}

export interface TabbyCaptureResponse {
  id: string;
  amount: string;
  created_at: string;
}

export interface TabbyRefundRequest {
  amount: string;
  reference_id: string;  // Required idempotency key
  reason?: string;
  items?: TabbyItem[];
}

export interface TabbyRefundResponse {
  id: string;
  amount: string;
  reason: string;
  created_at: string;
}

export interface TabbyWebhookPayload {
  id: string;
  status: 'authorized' | 'rejected' | 'expired' | 'closed';
  currency: string;
  amount: string;
  merchant_code: string;
  is_test: boolean;
}

export interface TabbyWebhookRegistrationRequest {
  url: string;
  is_test?: boolean;
  header?: {
    title: string;
    value: string;
  };
}

export interface TabbyWebhookRegistrationResponse {
  id: string;
  url: string;
  merchant_code: string;
  is_test: boolean;
  created_at: string;
}

export interface TabbyConfig {
  publicKey: string;
  secretKey: string;
  merchantCode: string;
  apiUrl: string;
  frontendUrl: string;
  backendUrl: string;
}

export interface TabbyErrorResponse {
  error: string;
  error_description?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
