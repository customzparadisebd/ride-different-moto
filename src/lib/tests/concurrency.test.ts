import { describe, it, expect, vi } from 'vitest';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

/**
 * Concurrency Test for Invoice Uniqueness.
 * Bypasses the server function wrapper to test the DB RPC directly
 * in a Vitest environment.
 */
describe('Invoice Concurrency Uniqueness', () => {
  it('should generate unique invoice serials under parallel load', async () => {
    // Execute 10 calls to the database function simultaneously
    const tasks = Array.from({ length: 10 }).map(() => 
      supabaseAdmin.rpc('generate_next_invoice_no', { is_test: true })
    );
    
    const results = await Promise.all(tasks);
    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    const errors = results.map(r => r.error).filter(Boolean);
    
    expect(errors.length).toBe(0);
    expect(invoices.length).toBe(10);
    
    const uniqueInvoices = new Set(invoices);
    expect(uniqueInvoices.size).toBe(10);
    
    // Sequence Continuity Verification
    const sorted = [...invoices].sort();
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = parseInt(sorted[i]?.split('-').pop() || '0');
      const next = parseInt(sorted[i+1]?.split('-').pop() || '0');
      expect(next).toBe(current + 1);
    }
  });
});

