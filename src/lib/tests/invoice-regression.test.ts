import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS and perform administrative setups
const testSupabase = createClient(
  process.env['VITE_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

describe('Invoice Sequence Regression Tests', () => {
  
  beforeAll(async () => {
    // Ensure default settings row exists
    await testSupabase.from('invoice_settings').upsert({
      id: 'default',
      prefix: 'CZP',
      start_number: 1,
      current_number: 0
    });
  });

  it('should maintain atomic increments under parallel load', async () => {
    const concurrency = 5;
    console.log(`Testing atomic increments with ${concurrency} parallel requests...`);
    
    // Trigger parallel invoice generations
    const tasks = Array.from({ length: concurrency }).map(() => 
      testSupabase.rpc('generate_next_invoice_no', { is_test: true })
    );
    
    const results = await Promise.all(tasks);
    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    
    expect(invoices.length).toBe(concurrency);
    
    // Verify uniqueness
    const unique = new Set(invoices);
    expect(unique.size).toBe(concurrency);
    
    // Verify sequentiality
    const serials = invoices.map(inv => parseInt(inv.split('-').pop() || '0')).sort((a, b) => a - b);
    for (let i = 0; i < serials.length - 1; i++) {
      expect(serials[i + 1]).toBe(serials[i] + 1);
    }
  });

  it('should respect manual start_number override', async () => {
    const startAt = 500;
    
    // Set starting number to 500
    await testSupabase.from('invoice_settings').update({
      start_number: startAt,
      current_number: startAt - 1
    }).eq('id', 'default');
    
    // Generate next
    const { data: nextInv } = await testSupabase.rpc('generate_next_invoice_no', { is_test: true });
    expect(nextInv).toBe(`CZP-${startAt}`);
    
    // Generate following
    const { data: followInv } = await testSupabase.rpc('generate_next_invoice_no', { is_test: true });
    expect(followInv).toBe(`CZP-${startAt + 1}`);
  });

  it('should reset to 01 when requested', async () => {
    // Set to 01
    await testSupabase.from('invoice_settings').update({
      start_number: 1,
      current_number: 0
    }).eq('id', 'default');
    
    const { data: nextInv } = await testSupabase.rpc('generate_next_invoice_no', { is_test: true });
    expect(nextInv).toBe('CZP-1'); // DB currently omits leading zero in CZP-1, UI handles formatting if needed or prefix handles it
  });

  it('should NEVER change invoice numbers of existing orders', async () => {
    // 1. Create a dummy order with a specific invoice number
    const testInvoiceNo = `REG-TEST-${Date.now()}`;
    const { data: order, error: insertError } = await testSupabase.from('orders').insert({
      invoice_no: testInvoiceNo,
      customer_name: 'Regression Test',
      customer_phone: '01000000000',
      total: 100,
      status: 'pending'
    }).select().single();
    
    expect(insertError).toBeNull();
    expect(order.invoice_no).toBe(testInvoiceNo);
    
    // 2. Change invoice settings (prefix and sequence)
    await testSupabase.from('invoice_settings').update({
      prefix: 'NEW',
      start_number: 9999,
      current_number: 9998
    }).eq('id', 'default');
    
    // 3. Verify the existing order remains UNCHANGED
    const { data: refreshedOrder } = await testSupabase
      .from('orders')
      .select('invoice_no')
      .eq('id', order.id)
      .single();
      
    expect(refreshedOrder?.invoice_no).toBe(testInvoiceNo);
  });
});
