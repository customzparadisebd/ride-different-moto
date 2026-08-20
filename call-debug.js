import { debugInvoiceSettings } from "./src/lib/debug-invoice.functions.js";
async function run() {
    const res = await debugInvoiceSettings();
    console.log(res);
}
run();
