ALTER TABLE "Purchase" ADD CONSTRAINT "purchase_quantity_check" CHECK (quantity > 0);
ALTER TABLE "Transfer" ADD CONSTRAINT "transfer_quantity_check" CHECK (quantity > 0);
ALTER TABLE "Transfer" ADD CONSTRAINT "transfer_base_check" CHECK ("sourceBaseId" != "destinationBaseId");
