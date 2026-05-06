// server/src/services/tamaraService.ts
import { logger } from '../config/logger';
import type { TamaraCheckoutParams } from '../types/tamara';

/** Tamara notifies this URL regardless of sandbox vs prod API host */
const TAMARA_NOTIFICATION_WEBHOOK =
  'https://my-invitation-api.vercel.app/api/payment/tamara/webhook';

function tamaraHeaders(): Record<string, string> {
  const token = process.env.TAMARA_API_TOKEN!;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
}

function tamaraApiBase(): string {
  const u = process.env.TAMARA_API_URL || 'https://api-sandbox.tamara.co';
  return u.replace(/\/$/, '');
}

async function tamaraRequestJson<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const base = tamaraApiBase();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: tamaraHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const errorBodyRaw = await res.text();
  let parsedBody: unknown = errorBodyRaw;
  try {
    parsedBody = errorBodyRaw ? JSON.parse(errorBodyRaw) : {};
  } catch {
    parsedBody = errorBodyRaw;
  }

  logger.info('Tamara API call', {
    endpoint: url,
    method,
    statusCode: res.status,
    responseBody: parsedBody
  });

  if (!res.ok) {
    throw new Error(`Tamara API error [${res.status}] ${url}: ${errorBodyRaw}`);
  }

  return (typeof parsedBody === 'object' && parsedBody !== null
    ? parsedBody
    : {}) as T;
}

function buildMerchantUrl() {
  const fe = process.env.FRONTEND_URL || 'http://localhost:3000';
  return {
    success: `${fe}/payment/success`,
    failure: `${fe}/payment/failure`,
    cancel: `${fe}/payment/cancel`,
    notification: TAMARA_NOTIFICATION_WEBHOOK
  };
}

async function createCheckoutSession(
  params: TamaraCheckoutParams
): Promise<{
  checkoutUrl: string;
  orderId: string;
  checkoutId: string;
}> {
  const shipping_address = {
    first_name: params.shipping_address.first_name,
    last_name: params.shipping_address.last_name,
    line1: params.shipping_address.line1 || 'N/A',
    city: params.shipping_address.city || 'Riyadh',
    country_code: (params.shipping_address.country_code || 'SA') as 'SA'
  };

  const body = {
    total_amount: params.total_amount,
    shipping_amount: params.shipping_amount,
    tax_amount: params.tax_amount,
    order_reference_id: params.order_reference_id,
    order_number: params.order_number ?? params.order_reference_id,
    country_code: params.country_code,
    description: params.description,
    items: params.items,
    consumer: params.consumer,
    merchant_url: buildMerchantUrl(),
    shipping_address,
    locale: params.locale,
    payment_type: params.payment_type,
    instalments: params.instalments ?? 3
  };

  const data = await tamaraRequestJson<{
    checkout_url: string;
    order_id: string;
    checkout_id: string;
  }>('POST', '/checkout', body);

  return {
    checkoutUrl: data.checkout_url,
    orderId: data.order_id,
    checkoutId: data.checkout_id
  };
}

async function authoriseOrder(tamaraOrderId: string): Promise<{
  status: string;
  auto_captured: boolean;
}> {
  const data = await tamaraRequestJson<Record<string, unknown>>(
    'POST',
    `/orders/${encodeURIComponent(tamaraOrderId)}/authorise`,
    {}
  );

  const status =
    (data.order_status as string) ||
    (data.orderStatus as string) ||
    (data.status as string) ||
    'unknown';

  const autoCaptured =
    (data.auto_captured as boolean) ??
    (data.autoCaptured as boolean) ??
    false;

  return {
    status,
    auto_captured: Boolean(autoCaptured)
  };
}

async function captureOrder(
  tamaraOrderId: string,
  amount: number,
  currency: string
): Promise<{
  captureId: string;
  status: string;
}> {
  const body = {
    order_id: tamaraOrderId,
    total_amount: { amount, currency },
    shipping_info: {
      shipped_at: new Date().toISOString(),
      shipping_company: 'N/A',
      tracking_number: 'N/A',
      tracking_url: 'N/A'
    }
  };

  const data = await tamaraRequestJson<{
    capture_id: string;
    order_id?: string;
    status: string;
  }>('POST', '/payments/capture', body);

  return {
    captureId: data.capture_id,
    status: data.status
  };
}

async function refundOrder(
  tamaraOrderId: string,
  amount: number,
  currency: string,
  comment: string
): Promise<{
  refundId: string;
  status: string;
}> {
  const body = {
    total_amount: { amount, currency },
    comment
  };

  const data = await tamaraRequestJson<{
    refund_id: string;
    order_id?: string;
    status: string;
  }>(
    'POST',
    `/payments/simplified-refund/${encodeURIComponent(tamaraOrderId)}`,
    body
  );

  return {
    refundId: data.refund_id,
    status: data.status
  };
}

async function getOrderDetails(tamaraOrderId: string): Promise<unknown> {
  return tamaraRequestJson<unknown>(
    'GET',
    `/merchants/orders/${encodeURIComponent(tamaraOrderId)}`
  );
}

export const tamaraService = {
  createCheckoutSession,
  authoriseOrder,
  captureOrder,
  refundOrder,
  getOrderDetails
};
