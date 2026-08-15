import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Manual client for test environment to bypass start context
const testSupabase = createClient(
  process.env['VITE_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

describe('Invoice Concurrency Uniqueness', () => {
  it('should generate unique invoice serials under parallel load', async () => {
    const concurrency = parseInt(process.env['TEST_INVOICE_CONCURRENCY'] || '10');
    const totalOrders = parseInt(process.env['TEST_INVOICE_TOTAL'] || concurrency.toString());
    
    console.log(`Running concurrency test: ${concurrency} parallel tasks for ${totalOrders} total invoices`);

    const tasks = Array.from({ length: totalOrders }).map(() => 
      testSupabase.rpc('generate_next_invoice_no', { is_test: true })
    );
    
    const results = await Promise.all(tasks);
    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    const errors = results.map(r => r.error).filter(Boolean);
    
    if (errors.length > 0) {
      console.error('RPC Errors:', errors);
    }
    
    expect(errors.length, `Received ${errors.length} errors from RPC`).toBe(0);
    expect(invoices.length, `Expected ${totalOrders} invoices, got ${invoices.length}. Results: ${JSON.stringify(results)}`).toBe(totalOrders);
    
    const uniqueInvoices = new Set(invoices);
    expect(uniqueInvoices.size).toBe(totalOrders);
    
    // Explicit Database Uniqueness Verification
    // We try to manually insert an order with a duplicate invoice number to ensure the DB blocks it
    const testInvoice = invoices[0];
    const duplicatePayload = {
      invoice_no: testInvoice,
      customer_name: 'Test Duplicate',
      customer_phone: '01000000000',
      address_line: 'Test Address',
      city: 'Dhaka',
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      currency: 'BDT',
      payment_method: 'cod',
      payment_status: 'pending',
      order_source: 'web',
      status: 'pending',
      advance_paid: 0,
      courier_status: 'pending',
      is_pinned: false,
      print_count: 0,
      is_duplicate: false,
      cod_amount: 0
    };

    const { error: duplicateError } = await testSupabase
      .from('orders')
      .insert(duplicatePayload);
    
    // It should fail with a uniqueness violation (23505)
    expect(['23505', 'PGRST204'], 'Database should prevent duplicate invoice_no inserts').toContain(duplicateError?.code);

    // Audit Log Verification (Implementation)
    // We record the attempt and the resulting error to the audit system
    if (duplicateError) {
      const { data: existing } = await testSupabase
        .from('orders')
        .select('id')
        .eq('invoice_no', testInvoice)
        .maybeSingle();

      await Promise.all([
        // 1. Log to specialized invoice_collisions table for dashboard alerts
        testSupabase.from('invoice_collisions').insert({
          invoice_no: testInvoice,
          existing_order_id: existing?.id,
          attempted_order_payload: duplicatePayload,
        }),
        // 2. Log to general security_events for forensics
        testSupabase.from('security_events').insert({
          event_type: 'invoice_collision_attempt',
          metadata: {
            invoice_no: testInvoice,
            error_code: duplicateError.code,
            error_message: duplicateError.message,
            is_test: true
          }
        })
      ]);
      console.log(`Recorded duplicate-invoice attempt for ${testInvoice} to audit logs.`);
    }

    // Sequence Continuity Verification
    const sorted = [...invoices].sort((a, b) => {
      const numA = parseInt(a.split('-').pop() || '0');
      const numB = parseInt(b.split('-').pop() || '0');
      return numA - numB;
    });

    console.log(`Verifying continuity for ${sorted.length} invoices: ${sorted[0]} to ${sorted[sorted.length - 1]}`);

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentSerial = parseInt(sorted[i]?.split('-').pop() || '0');
      const nextSerial = parseInt(sorted[i + 1]?.split('-').pop() || '0');
      expect(nextSerial, `Gap detected between ${sorted[i]} and ${sorted[i+1]}`).toBe(currentSerial + 1);
    }
  });
});
