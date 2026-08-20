import { createFileRoute } from '@tanstack/react-router';
import { debugInvoiceSettings } from '@/lib/debug-invoice.functions';

export const Route = createFileRoute('/debug-invoice')({
  loader: async () => {
    const res = await debugInvoiceSettings();
    return res;
  },
  component: () => {
    const res = Route.useLoaderData();
    return <pre>{JSON.stringify(res, null, 2)}</pre>;
  }
});
