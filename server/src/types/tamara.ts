// server/src/types/tamara.ts

export interface TamaraMoney {
  amount: number;
  currency: 'SAR';
}

/** Fields passed into createCheckoutSession (merchant URLs are applied inside the service). */
export interface TamaraCheckoutParams {
  total_amount: TamaraMoney;
  shipping_amount: TamaraMoney;
  tax_amount: TamaraMoney;
  order_reference_id: string;
  country_code: 'SA';
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    reference_id: string;
    type: 'Digital';
    sku: string;
    unit_price: TamaraMoney;
    total_amount: TamaraMoney;
  }>;
  consumer: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  };
  /** Wire format uses Tamara country_code; callers may omit and default SA. */
  shipping_address: {
    first_name: string;
    last_name: string;
    line1: string;
    city: string;
    country_code?: 'SA';
  };
  locale: 'ar_SA' | string;
  payment_type: 'PAY_BY_INSTALMENTS';
  /** Defaults to 3 in the service; required by Tamara OpenAPI. */
  instalments?: number;
  order_number?: string;
}

export type TamaraPaymentStatusEnum =
  | 'pending'
  | 'authorised'
  | 'captured'
  | 'fully_captured'
  | 'expired'
  | 'declined'
  | 'failed';
