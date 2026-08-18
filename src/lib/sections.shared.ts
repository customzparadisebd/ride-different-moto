import { z } from "zod";

export const sectionSettingInput = z.object({
  id: z.string(),
  name: z.string().min(1),
  enabled: z.boolean(),
  displayLimit: z.number().int().min(1).max(100),
  showSeeAll: z.boolean(),
  buttonText: z.string().min(1),
  buttonLink: z.string().min(1),
  sortOrder: z.number().int(),
  isSlider: z.boolean(),
  sliderItems: z.number().int().min(1).max(10).optional().nullable(),
  productCategory: z.string().trim().max(40).optional().nullable(),
});

export type SectionSetting = z.infer<typeof sectionSettingInput>;

export function parseSectionSettingRow(row: any): SectionSetting {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    displayLimit: row.display_limit,
    showSeeAll: row.show_see_all,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    sortOrder: row.sort_order,
    isSlider: row.is_slider,
    sliderItems: row.slider_items,
    productCategory: row.product_category,
  };
}
