// Validación y parsing de webhooks de Gumroad

export interface GumroadPayload {
  seller_id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  product_permalink: string;
  email: string;
  price: number;           // en centavos USD
  currency: string;
  quantity: number;
  order_number: number;
  sale_id: string;
  sale_timestamp: string;
  purchaser_id?: string;
  full_name?: string;
  variants?: Record<string, string>;
  test?: boolean;
  // UTM si Gumroad los pasa
  url_params?: Record<string, string>;
}

export interface GumroadPurchase {
  contactEmail: string;
  contactName: string;
  productoId: string;
  producto: string;
  monto: number;           // centavos CLP (aprox — ver nota)
  plataforma: "gumroad";
  estadoPago: "completado" | "reembolsado";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  esTest: boolean;
}

// Tipo de cambio referencia USD → CLP (actualizar según necesidad)
const USD_TO_CLP = 950;

export function parseGumroadWebhook(body: Record<string, unknown>): GumroadPurchase | null {
  const email = body.email as string;
  const productName = body.product_name as string;
  const priceRaw = body.price;

  if (!email || !productName) return null;

  // Gumroad envía price en centavos USD
  const priceCentsUSD = typeof priceRaw === "number" ? priceRaw : parseInt(String(priceRaw ?? "0"), 10);
  const montoCLP = Math.round((priceCentsUSD / 100) * USD_TO_CLP * 100); // centavos CLP

  const urlParams = body.url_params as Record<string, string> | undefined;

  return {
    contactEmail: email,
    contactName: (body.full_name as string) || "",
    productoId: (body.product_id as string) || "",
    producto: productName,
    monto: montoCLP,
    plataforma: "gumroad",
    estadoPago: "completado",
    utmSource: urlParams?.utm_source,
    utmMedium: urlParams?.utm_medium,
    utmCampaign: urlParams?.utm_campaign,
    utmContent: urlParams?.utm_content,
    esTest: (body.test as boolean) ?? false,
  };
}

export function isValidGumroadPayload(body: Record<string, unknown>): boolean {
  return typeof body.email === "string" && typeof body.product_name === "string";
}
