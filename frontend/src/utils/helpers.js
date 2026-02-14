export function formatCurrency(amount){ return typeof amount === 'number' ? `$${amount.toFixed(2)}` : amount; }
export function safeJson(obj){ try { return JSON.stringify(obj, null, 2); } catch (e) { return String(obj); } }
