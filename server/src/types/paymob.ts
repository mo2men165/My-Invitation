// server/src/types/paymob.ts
export interface PaymobAuthResponse {
  token: string;
  profile: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface PaymobOrderRequest {
  auth_token: string;
  delivery_needed: boolean;
  amount_cents: number;
  currency: string;
  merchant_order_id: string;
  items: Array<{
    name: string;
    amount_cents: number;
    description: string;
    quantity: number;
  }>;
  shipping_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city: string;
    country: string;
  };
}

export interface PaymobOrderResponse {
  id: number;
  created_at: string;
  delivery_needed: boolean;
  merchant: {
    id: number;
    created_at: string;
    phones: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
  };
  collector: {
    id: number;
    created_at: string;
    phones: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
  };
  amount_cents: number;
  shipping_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city: string;
    country: string;
  };
  currency: string;
  is_payment_locked: boolean;
  is_return: boolean;
  is_cancel: boolean;
  is_returned: boolean;
  is_canceled: boolean;
  merchant_order_id: string;
  wallet_notification: string;
  paid_amount_cents: number;
  notify_user_with_email: boolean;
  order_url: string;
  commission_fees: number;
  delivery_fees_cents: number;
  delivery_vat_cents: number;
  payment_method: string;
  merchant_staff_tag: string;
  api_source: string;
  data: {
    id: number;
    created_at: string;
    delivery_needed: boolean;
    merchant: {
      id: number;
      created_at: string;
      phones: string[];
      company_emails: string[];
      company_name: string;
      state: string;
      country: string;
      city: string;
      postal_code: string;
      street: string;
    };
    collector: {
      id: number;
      created_at: string;
      phones: string[];
      company_emails: string[];
      company_name: string;
      state: string;
      country: string;
      city: string;
      postal_code: string;
      street: string;
    };
    amount_cents: number;
    shipping_data: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      city: string;
      country: string;
    };
    currency: string;
    is_payment_locked: boolean;
    is_return: boolean;
    is_cancel: boolean;
    is_returned: boolean;
    is_canceled: boolean;
    merchant_order_id: string;
    wallet_notification: string;
    paid_amount_cents: number;
    notify_user_with_email: boolean;
    order_url: string;
    commission_fees: number;
    delivery_fees_cents: number;
    delivery_vat_cents: number;
    payment_method: string;
    merchant_staff_tag: string;
    api_source: string;
  };
}

export interface PaymobPaymentKeyRequest {
  auth_token: string;
  amount_cents: number;
  expiration: number;
  order_id: number;
  billing_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    city: string;
    country: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
    postal_code: string;
    state: string;
  };
  currency: string;
  integration_id: number;
  lock_order_when_paid: boolean;
}

export interface PaymobPaymentKeyResponse {
  token: string;
  iframe_url: string;
}

export interface PaymobWebhookData {
  type: string;
  obj: {
    id: number;
    pending: boolean;
    amount_cents: number;
    currency: string;
    order: {
      id: number;
      created_at: string;
      delivery_needed: boolean;
      merchant: {
        id: number;
        created_at: string;
        phones: string[];
        company_emails: string[];
        company_name: string;
        state: string;
        country: string;
        city: string;
        postal_code: string;
        street: string;
      };
      collector: {
        id: number;
        created_at: string;
        phones: string[];
        company_emails: string[];
        company_name: string;
        state: string;
        country: string;
        city: string;
        postal_code: string;
        street: string;
      };
      amount_cents: number;
      shipping_data: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        city: string;
        country: string;
      };
      currency: string;
      is_payment_locked: boolean;
      is_return: boolean;
      is_cancel: boolean;
      is_returned: boolean;
      is_canceled: boolean;
      merchant_order_id: string;
      wallet_notification: string;
      paid_amount_cents: number;
      notify_user_with_email: boolean;
      order_url: string;
      commission_fees: number;
      delivery_fees_cents: number;
      delivery_vat_cents: number;
      payment_method: string;
      merchant_staff_tag: string;
      api_source: string;
    };
    created_at: string;
    is_captured: boolean;
    integration_id: number;
    data: {
      acquirer: string;
      avs_result_code: string;
      card_num: string;
      kiosk_id: string;
      ref_num: string;
      ref_pos: string;
      terminal_id: string;
      txn_response_code: string;
      gateway_integration_pk: number;
      gateway: string;
      merchant: string;
      merchant_txn_ref: string;
      merchant_extra: string;
      merchant_extra2: string;
      merchant_extra3: string;
      merchant_extra4: string;
      merchant_extra5: string;
      merchant_extra6: string;
      merchant_extra7: string;
      merchant_extra8: string;
      merchant_extra9: string;
      merchant_extra10: string;
      merchant_extra11: string;
      merchant_extra12: string;
      merchant_extra13: string;
      merchant_extra14: string;
      merchant_extra15: string;
      merchant_extra16: string;
      merchant_extra17: string;
      merchant_extra18: string;
      merchant_extra19: string;
      merchant_extra20: string;
      merchant_extra21: string;
      merchant_extra22: string;
      merchant_extra23: string;
      merchant_extra24: string;
      merchant_extra25: string;
      merchant_extra26: string;
      merchant_extra27: string;
      merchant_extra28: string;
      merchant_extra29: string;
      merchant_extra30: string;
      merchant_extra31: string;
      merchant_extra32: string;
      merchant_extra33: string;
      merchant_extra34: string;
      merchant_extra35: string;
      merchant_extra36: string;
      merchant_extra37: string;
      merchant_extra38: string;
      merchant_extra39: string;
      merchant_extra40: string;
      merchant_extra41: string;
      merchant_extra42: string;
      merchant_extra43: string;
      merchant_extra44: string;
      merchant_extra45: string;
      merchant_extra46: string;
      merchant_extra47: string;
      merchant_extra48: string;
      merchant_extra49: string;
      merchant_extra50: string;
      merchant_extra51: string;
      merchant_extra52: string;
      merchant_extra53: string;
      merchant_extra54: string;
      merchant_extra55: string;
      merchant_extra56: string;
      merchant_extra57: string;
      merchant_extra58: string;
      merchant_extra59: string;
      merchant_extra60: string;
      merchant_extra61: string;
      merchant_extra62: string;
      merchant_extra63: string;
      merchant_extra64: string;
      merchant_extra65: string;
      merchant_extra66: string;
      merchant_extra67: string;
      merchant_extra68: string;
      merchant_extra69: string;
      merchant_extra70: string;
      merchant_extra71: string;
      merchant_extra72: string;
      merchant_extra73: string;
      merchant_extra74: string;
      merchant_extra75: string;
      merchant_extra76: string;
      merchant_extra77: string;
      merchant_extra78: string;
      merchant_extra79: string;
      merchant_extra80: string;
      merchant_extra81: string;
      merchant_extra82: string;
      merchant_extra83: string;
      merchant_extra84: string;
      merchant_extra85: string;
      merchant_extra86: string;
      merchant_extra87: string;
      merchant_extra88: string;
      merchant_extra89: string;
      merchant_extra90: string;
      merchant_extra91: string;
      merchant_extra92: string;
      merchant_extra93: string;
      merchant_extra94: string;
      merchant_extra95: string;
      merchant_extra96: string;
      merchant_extra97: string;
      merchant_extra98: string;
      merchant_extra99: string;
      merchant_extra100: string;
    };
    success: boolean;
    is_standalone_payment: boolean;
    error_occured: boolean;
    is_auth: boolean;
    is_capture: boolean;
    source_data: {
      pan: string;
      type: string;
      sub_type: string;
    };
    acq_response_code: string;
    txn_response_code: string;
    hmac: string;
  };
}

export interface PaymobErrorResponse {
  detail: string;
  type: string;
}

export interface PaymobConfig {
  apiKey: string;
  publicKey: string;
  secretKey: string;
  integrationId: number;
  iframeId: number;
  baseUrl: string;
  currency: string;
  language: string;
  debugMode: boolean;
  webhookUrl: string;
  returnUrl: string;
  cancelUrl: string;
}
