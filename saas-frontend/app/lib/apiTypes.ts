// Formato (parcial) das respostas da API usadas em listagens do painel

export interface ApiVariation {
  id?: string;
  name?: string;
  price?: number | string | null;
  compareAtPrice?: number | string | null;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug?: string;
  categoryName?: string | null;
  visibility?: string;
  imageUrl?: string;
  variations?: ApiVariation[];
}

export interface ApiOrder {
  id?: string;
  orderId?: string;
  status?: string;
  amount?: number | string;
  totalAmount?: number | string;
  createdAt?: string;
  productName?: string;
  variationName?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
  customer?: { fullName?: string; email?: string };
}

/** Mensagem de um erro capturado em catch, quando houver. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "";
}
