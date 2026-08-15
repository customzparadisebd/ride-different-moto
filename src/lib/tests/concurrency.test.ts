import { describe, it, expect } from 'vitest';
import { runInvoiceStressTest } from '../stress-test.functions';

/**
 * Concurrency Test for Invoice Uniqueness.
 * Verifies that parallel requests to generate invoice numbers result in 
 * unique, sequential IDs without gaps or collisions.
 */
describe('Invoice Concurrency Uniqueness', () => {
  it('should generate unique invoice serials under parallel load', async () => {
    // Note: This calls the server function which in turn calls the DB RPC.
    // It requires the backend to be running and accessible to supabaseAdmin.
    const result = await runInvoiceStressTest();
    
    expect(result.success).toBe(true);
    expect(result.duplicates).toBe(0);
    expect(result.unique).toBe(result.total);
    
    // Sequence Continuity Verification
    if (result.invoices.length > 1) {
      const sorted = [...result.invoices].sort();
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = parseInt(sorted[i]?.split('-').pop() || '0');
        const next = parseInt(sorted[i+1]?.split('-').pop() || '0');
        expect(next).toBe(current + 1);
      }
    }
  });
});
