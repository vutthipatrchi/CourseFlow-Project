-- Free enrollment records an order and subscription without a provider payment.
ALTER TABLE courseflow.orders DROP CONSTRAINT orders_subtotal_satang_check;
ALTER TABLE courseflow.orders DROP CONSTRAINT orders_total_satang_check;
ALTER TABLE courseflow.orders ADD CONSTRAINT orders_subtotal_satang_check CHECK (subtotal_satang >= 0);
ALTER TABLE courseflow.orders ADD CONSTRAINT orders_total_satang_check CHECK (total_satang >= 0);
