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
    
    // Debug individual results to see why uniqueness fails
    results.forEach((r, i) => {
      if (r.error) console.error(`Task ${i} error:`, r.error);
      else console.log(`Task ${i} result:`, r.data);
    });

    const invoices = results.map(r => r.data).filter(Boolean) as string[];
    const errors = results.map(r => r.error).filter(Boolean);
    
    expect(errors.length, `Received ${errors.length} errors from RPC`).toBe(0);
    expect(invoices.length, `Expected ${totalOrders} invoices, got ${invoices.length}`).toBe(totalOrders);
    
    const uniqueInvoices = new Set(invoices);
    const hasDuplicates = uniqueInvoices.size < totalOrders;

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
    if (duplicateError) {
      expect(['23505', 'PGRST204'], 'Database should prevent duplicate invoice_no inserts').toContain(duplicateError.code);
    } else {
      // If no error, check if the insert actually happened (it shouldn't if duplicate)
      const { data: countData } = await testSupabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('invoice_no', testInvoice);
      expect(countData, 'Should have exactly 1 order with this invoice number').toBe(1);
      console.warn(`WARNING: Duplicate insert of ${testInvoice} did not return an error.`);
    }

    // Audit Log Verification (Implementation)
    // We record duplicate attempts and resulting errors to the audit system
    // 1. If we caught a duplicate via the manual insert above (expected)
    // 2. If the concurrency run itself produced duplicates (unexpected, indicates lock failure)
    if (duplicateError || hasDuplicates) {
      const { data: existing } = await testSupabase
        .from('orders')
        .select('id')
        .eq('invoice_no', testInvoice)
        .maybeSingle();

      const auditEntries = [];
      
      // Log the intentional manual collision
      if (duplicateError) {
        auditEntries.push(
          testSupabase.from('invoice_collisions').insert({
            invoice_no: testInvoice,
            existing_order_id: existing?.id,
            attempted_order_payload: duplicatePayload,
          }),
          testSupabase.from('security_events').insert({
            event_type: 'invoice_collision_attempt',
            metadata: {
              invoice_no: testInvoice,
              error_code: duplicateError.code,
              error_message: duplicateError.message,
              source: 'manual_verification',
              is_test: true
            }
          })
        );
      }

      // Log if the RPC itself failed to provide unique numbers (Concurrency Failure)
      if (hasDuplicates) {
        auditEntries.push(
          testSupabase.from('security_events').insert({
            event_type: 'invoice_concurrency_failure',
            metadata: {
              total_orders: totalOrders,
              unique_count: uniqueInvoices.size,
              duplicates: invoices.filter((item, index) => invoices.indexOf(item) !== index),
              is_test: true
            }
          })
        );
      }

      await Promise.all(auditEntries);
      console.log(`Recorded audit logs for duplicate-invoice verification.`);
    }

    // Assert uniqueness after logging if failure occurred
    expect(uniqueInvoices.size, `Duplicates detected in: ${JSON.stringify(invoices)}`).toBe(totalOrders);

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
