import { shippingBillService } from "./services/shippingBillService.js";
import { getDeclaredValue, getQuantitiesByUnit, validateShippingBill } from "./domain/shippingBill.js";
import { createGoodsRow, readGoodsRows } from "./components/goodsItems.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const form = $("#shippingForm");
const rows = $("#itemRows");
let unitOptions = ["pcs", "kg", "box", "carton", "set"];
let toastTimer;
let savedDrafts = [];
let currentDraftId = null;

function option(value, label = value) { const item = document.createElement("option"); item.value = value; item.textContent = label; return item; }
function populateSelect(select, values, labelOf = value => value, valueOf = value => value) {
  values.forEach(item => select.append(option(valueOf(item), labelOf(item))));
}
function addItem(data = {}) {
  const row = createGoodsRow(data, unitOptions);
  rows.append(row);
  row.addEventListener("input", updateSummary);
  row.addEventListener("change", updateSummary);
  $(".remove-item", row).addEventListener("click", () => {
    if (rows.children.length === 1) { showToast("Keep at least one goods row in the form."); return; }
    row.remove(); updateSummary();
  });
  updateSummary();
}
const lineItems = () => readGoodsRows(rows);
function updateSummary() {
  const items = lineItems();
  const count = items.filter(item => item.description || item.quantity || item.unitValue).length;
  const quantities = getQuantitiesByUnit(items);
  const total = getDeclaredValue(items);
  $("#summaryItems").textContent = String(count);
  $("#summaryQty").textContent = Object.entries(quantities).map(([unit, quantity]) => `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(quantity)} ${unit}`).join(" · ") || "—";
  $("#summaryTotal").textContent = currency(total);
  $("#itemCount").textContent = `${rows.children.length} ${rows.children.length === 1 ? "item" : "items"}`;
}
function currency(amount) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount); }

function clearErrors() {
  $$('[aria-invalid="true"]').forEach(field => field.removeAttribute("aria-invalid"));
  $$(".field-error").forEach(error => { error.textContent = ""; });
}
function validate() {
  clearErrors();
  const values = Object.fromEntries(new FormData(form).entries());
  const result = validateShippingBill(values, lineItems());
  Object.entries(result.errors).forEach(([key, message]) => {
    const error = $(`[data-error="${key}"]`);
    if (error) error.textContent = message;
    if (key.startsWith("item-")) {
      const row = rows.children[Number(key.slice(5))];
      row?.querySelectorAll("input").forEach(field => field.setAttribute("aria-invalid", "true"));
    } else if (key !== "items") {
      const field = $(`#${key}`);
      field?.setAttribute("aria-invalid", "true");
    }
  });
  return result.valid;
}

function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}
function resetForm() {
  form.reset(); clearErrors(); rows.replaceChildren(); addItem(); currentDraftId = null;
  $("#invoiceDate").value = new Date().toISOString().slice(0, 10);
  $("#notesCount").textContent = "0"; $("#submitButton").innerHTML = 'Save as draft <span aria-hidden="true">→</span>';
  showToast("Form reset. Your saved drafts are unchanged."); $("#exporter").focus();
}

function renderDrafts() {
  const list = $("#draftList"); list.replaceChildren();
  $("#draftCount").textContent = String(savedDrafts.length);
  if (!savedDrafts.length) { const empty = document.createElement("p"); empty.className = "draft-empty"; empty.textContent = "Your saved drafts will appear here."; list.append(empty); return; }
  savedDrafts.forEach(draft => {
    const entry = document.createElement("div"); entry.className = "draft-entry";
    const open = document.createElement("button"); open.type = "button"; open.className = "draft-open";
    const title = document.createElement("strong"); title.textContent = draft.invoice || draft.id;
    const meta = document.createElement("span"); meta.textContent = `${draft.id} · ${new Date(draft.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
    open.append(title, meta); open.addEventListener("click", () => loadDraft(draft));
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "draft-delete"; remove.textContent = "×"; remove.setAttribute("aria-label", `Delete draft ${draft.invoice || draft.id}`);
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Delete draft ${draft.invoice || draft.id}? This cannot be undone.`)) return;
      try { await shippingBillService.deleteDraft(draft.id); savedDrafts = await shippingBillService.getDrafts(); renderDrafts(); if (currentDraftId === draft.id) resetForm(); showToast("Draft deleted."); }
      catch { showToast("Could not delete this draft. Try again."); }
    });
    entry.append(open, remove); list.append(entry);
  });
}
function loadDraft(draft) {
  clearErrors();
  const values = { exporter: draft.exporter, iec: draft.iec, consignee: draft.consignee, destination: draft.destination, port: draft.port, transport: draft.transport, invoice: draft.invoice, invoiceDate: draft.invoiceDate, notes: draft.notes };
  Object.entries(values).forEach(([id, value]) => { const field = $(`#${id}`); if (field && value != null) field.value = value; });
  rows.replaceChildren(); (draft.items.length ? draft.items : [{}]).forEach(item => addItem(item));
  $("#notesCount").textContent = String((draft.notes || "").length);
  currentDraftId = draft.id; $("#submitButton").innerHTML = 'Update saved draft <span aria-hidden="true">→</span>';
  updateSummary(); $("#exporter").focus(); showToast(`Opened draft ${draft.id}.`);
}

$("#addItem").addEventListener("click", () => { addItem(); $(".item-description", rows.lastElementChild).focus(); });
$("#resetButton").addEventListener("click", resetForm);
$("#notes").addEventListener("input", event => { $("#notesCount").textContent = String(event.target.value.length); });
form.addEventListener("input", event => {
  if (event.target.matches("[aria-invalid='true']")) {
    event.target.removeAttribute("aria-invalid");
    const error = $(`[data-error="${event.target.id}"]`);
    if (error) error.textContent = "";
  }
  if (event.target.closest("#itemRows")) {
    $("[data-error='items']").textContent = "";
    $$("[aria-invalid='true']", rows).forEach(field => field.removeAttribute("aria-invalid"));
  }
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!validate()) { showToast("Check the highlighted fields to continue."); $(`[aria-invalid="true"]`)?.focus(); return; }
  const button = $("#submitButton"); button.disabled = true; button.innerHTML = '<span class="spinner" aria-hidden="true"></span> Saving draft…';
  const payload = {
    id: currentDraftId,
    exporter: $("#exporter").value, iec: $("#iec").value.trim(), consignee: $("#consignee").value.trim(),
    destination: $("#destination").value, port: $("#port").value, transport: $("#transport").value,
    invoice: $("#invoice").value.trim(), invoiceDate: $("#invoiceDate").value, notes: $("#notes").value.trim(),
    items: lineItems().filter(item => item.description && item.quantity > 0 && item.unitValue > 0).map(({ description, hsCode, quantity, unit, unitValue }) => ({ description, hsCode, quantity, unit, unitValue }))
  };
  try {
    const saved = await shippingBillService.saveDraft(payload); currentDraftId = saved.id;
    savedDrafts = await shippingBillService.getDrafts(); renderDrafts();
    $("#submitButton").innerHTML = 'Update saved draft <span aria-hidden="true">→</span>';
    $("#successMessage").textContent = `Draft ${saved.id} is ready for review.`;
    $("#successDialog").hidden = false; $("#closeDialog").focus();
  } catch {
    showToast("We couldn’t save your draft. Please try again.");
  } finally {
    button.disabled = false; button.innerHTML = `${currentDraftId ? "Update saved draft" : "Save as draft"} <span aria-hidden="true">→</span>`;
  }
});
$("#closeDialog").addEventListener("click", () => { $("#successDialog").hidden = true; $("#addItem").focus(); });
$("#successDialog").addEventListener("click", event => { if (event.target.id === "successDialog") $("#successDialog").hidden = true; });
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#successDialog").hidden) { $("#successDialog").hidden = true; $("#closeDialog").focus(); }
});

async function initialize() {
  const banner = $("#loadBanner"); banner.hidden = false; banner.textContent = "Loading your shipping options…";
  try {
    const data = await shippingBillService.getFormOptions();
    populateSelect($("#exporter"), data.exporters); populateSelect($("#destination"), data.countries, item => item.name, item => item.code);
    populateSelect($("#port"), data.ports); populateSelect($("#transport"), data.transports);
    unitOptions = data.units;
    banner.hidden = true;
  } catch {
    banner.textContent = "Shipping options couldn’t be loaded. Refresh the page to try again.";
    banner.classList.add("load-error");
  }
  $("#invoiceDate").value = new Date().toISOString().slice(0, 10);
  addItem();
  try {
    await shippingBillService.checkStorage();
    savedDrafts = await shippingBillService.getDrafts(); renderDrafts();
  } catch {
    const banner = $("#loadBanner"); banner.hidden = false; banner.classList.add("load-error");
    banner.textContent = "Browser storage is blocked, so drafts cannot be saved on this device. Enable site storage and reload to continue.";
    $("#submitButton").disabled = true;
    $("#submitButton").title = "Enable browser storage to save drafts.";
  }
}
initialize();
