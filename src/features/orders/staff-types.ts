import type { OrderStatus } from './schemas';

export type StaffOrderItem = {
  id: string;
  name: string;
  quantity: number;
  prep_station: 'kitchen' | 'bar' | 'none';
  options: Array<{ name: string; group: string; quantity: number }>;
};

export type StaffOrder = {
  id: string;
  number: number;
  status: OrderStatus;
  table_id: string;
  table_label: string;
  zone: string | null;
  table_session_id: string;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  note: string | null;
  subtotal_cents: number;
  items: StaffOrderItem[];
};

export type ActiveOrdersSnapshot = {
  orders: StaffOrder[];
  serverNow: number;
  acceptingOrders: boolean;
  kitchenWarningMinutes: number;
  kitchenCriticalMinutes: number;
};

export type TableOverview = {
  id: string;
  label: string;
  zone: string | null;
  session: null | {
    id: string;
    opened_at: string;
    orders: number;
    pending: number;
    validated_cents: number;
  };
};
