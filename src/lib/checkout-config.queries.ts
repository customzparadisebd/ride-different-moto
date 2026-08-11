// CITY & DELIVERY ZONES — COMPLETED
import { queryOptions } from "@tanstack/react-query";

import { getCheckoutConfig } from "./checkout-config.functions";

export const checkoutConfigQuery = () =>
  queryOptions({
    queryKey: ["checkout-config"],
    queryFn: () => getCheckoutConfig(),
    staleTime: 60_000,
  });
