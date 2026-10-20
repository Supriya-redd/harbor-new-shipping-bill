export const requiredFields = ["exporter", "iec", "consignee", "destination", "port", "transport", "invoice", "invoiceDate"];

export function validateShippingBill(values, items, today = new Date().toISOString().slice(0, 10)) {
  const errors = {};
  requiredFields.forEach(field => { if (!String(values[field] || "").trim()) errors[field] = "This field is required."; });
  if (values.iec?.trim() && !/^\d{10}$/.test(values.iec.trim())) errors.iec = "Enter a valid 10-digit IEC.";
  if (values.invoiceDate && values.invoiceDate > today) errors.invoiceDate = "Invoice date cannot be in the future.";

  let completeItems = 0;
  let hasIncompleteItem = false;
  items.forEach((item, index) => {
    const started = item.description || item.quantityInput || item.unitValueInput || item.hsCode;
    if (!started) return;
    let valid = true;
    if (!item.description) valid = false;
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) valid = false;
    if (!Number.isFinite(item.unitValue) || item.unitValue <= 0) valid = false;
    if (item.hsCode && !/^\d{4,8}$/.test(item.hsCode)) valid = false;
    if (valid) completeItems++;
    else { hasIncompleteItem = true; errors[`item-${index}`] = "Complete this item with a description, positive quantity and unit value. HS codes must be 4–8 digits."; }
  });
  if (hasIncompleteItem) errors.items = "Complete each started item with a description, positive quantity and unit value. HS codes must be 4–8 digits.";
  else if (!completeItems) errors.items = "Add at least one complete goods item.";
  return { errors, valid: Object.keys(errors).length === 0 };
}

export function getDeclaredValue(items) {
  return items.reduce((sum, item) => sum + (Number.isFinite(item.quantity * item.unitValue) ? item.quantity * item.unitValue : 0), 0);
}

export function getQuantitiesByUnit(items) {
  return items.reduce((totals, item) => {
    if (item.quantity > 0) totals[item.unit] = (totals[item.unit] || 0) + item.quantity;
    return totals;
  }, {});
}
