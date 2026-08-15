-- SYNC SEQUENCES
-- Run this AFTER data import to ensure new orders follow existing numbering
SELECT setval('public.invoice_seq', (SELECT COALESCE(MAX(last_value), 1) FROM pg_sequences WHERE sequencename = 'invoice_seq'));
SELECT setval('public.invoice_number_seq', (SELECT COALESCE(MAX(last_value), 1) FROM pg_sequences WHERE sequencename = 'invoice_number_seq'));
