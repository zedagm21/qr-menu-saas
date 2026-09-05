import type { PublicMenuItem } from './index';

export interface OrderItem {
    item: PublicMenuItem;
    quantity: number;
}

export type OrderTab = Record<string, OrderItem>;
