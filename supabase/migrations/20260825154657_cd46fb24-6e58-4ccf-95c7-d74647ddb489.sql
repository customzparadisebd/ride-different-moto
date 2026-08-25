ALTER TABLE public.product_colors
  ADD COLUMN IF NOT EXISTS linked_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS product_colors_linked_product_id_idx
  ON public.product_colors(linked_product_id);