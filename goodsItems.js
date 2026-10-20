const escapeAttr = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function createGoodsRow(data = {}, units = []) {
  const row = document.createElement("tr");
  row.innerHTML = `<td><input class="item-description" aria-label="Item description" required maxlength="120" placeholder="e.g. Organic cotton shirts" value="${escapeAttr(data.description || "")}"></td>
    <td><input class="item-hs" aria-label="HS code (optional)" inputmode="numeric" maxlength="8" placeholder="e.g. 610910" value="${escapeAttr(data.hsCode || "")}"></td>
    <td><input class="item-quantity" aria-label="Quantity" type="number" min="0.01" step="any" placeholder="0" value="${escapeAttr(data.quantity ?? "")}"></td>
    <td><select class="item-unit" aria-label="Unit">${units.map(unit => `<option value="${escapeAttr(unit)}"${unit === (data.unit || "pcs") ? " selected" : ""}>${escapeAttr(unit)}</option>`).join("")}</select></td>
    <td><div class="money-input"><span aria-hidden="true">₹</span><input class="item-value" aria-label="Unit value in Indian rupees" type="number" min="0.01" step="0.01" placeholder="0.00" value="${escapeAttr(data.unitValue ?? "")}"></div></td>
    <td><button class="remove-item" type="button" aria-label="Remove item">×</button></td>`;
  return row;
}

export function readGoodsRows(container) {
  return [...container.querySelectorAll("tr")].map(row => ({
    description: row.querySelector(".item-description").value.trim(),
    hsCode: row.querySelector(".item-hs").value.trim(),
    quantityInput: row.querySelector(".item-quantity").value,
    quantity: Number(row.querySelector(".item-quantity").value),
    unit: row.querySelector(".item-unit").value,
    unitValueInput: row.querySelector(".item-value").value,
    unitValue: Number(row.querySelector(".item-value").value)
  }));
}
