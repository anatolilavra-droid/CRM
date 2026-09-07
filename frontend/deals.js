import { apiRequest, requireAuth, showToast, renderTopbar } from "./api.js";

requireAuth();
renderTopbar("deals");

const params = new URLSearchParams(window.location.search);
const filterClientId = params.get("client_id");

const container = document.getElementById("deals-container");
const subtitle = document.getElementById("deals-subtitle");
const modal = document.getElementById("deal-modal");
const form = document.getElementById("deal-form");
const clientSelect = document.getElementById("deal-client");
const titleField = document.getElementById("deal-title");
const amountField = document.getElementById("deal-amount");

const STATUSES = [
  { key: "open", label: "Open" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

let clientsById = {};

function openModal() {
  form.reset();
  if (filterClientId) clientSelect.value = filterClientId;
  modal.classList.add("visible");
  titleField.focus();
}

function closeModal() {
  modal.classList.remove("visible");
}

document.getElementById("new-deal-btn").addEventListener("click", openModal);
document.getElementById("deal-modal-close").addEventListener("click", closeModal);
document.getElementById("deal-cancel-btn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatAmount(amount) {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function dealCardHtml(deal) {
  const client = clientsById[deal.client_id];
  const amount = formatAmount(deal.amount);
  const moves = STATUSES.filter((s) => s.key !== deal.status);
  return `
    <div class="deal-card" data-deal-id="${deal.id}">
      <div class="deal-title">${escapeHtml(deal.title)}</div>
      <div class="deal-client">${client ? escapeHtml(client.name) : "Unknown client"}</div>
      ${amount ? `<div class="deal-amount">${amount}</div>` : ""}
      <div class="deal-card-actions">
        ${moves
          .map(
            (s) =>
              `<button class="chip-btn move-${s.key}" data-move="${deal.id}" data-status="${s.key}">→ ${s.label}</button>`
          )
          .join("")}
        <button class="chip-btn" data-delete="${deal.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderKanban(deals) {
  if (deals.length === 0) {
    container.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon">📋</div>
        <p>No deals yet. Create one to start tracking your pipeline.</p>
      </div>
    `;
    return;
  }

  const columns = STATUSES.map((status) => {
    const items = deals.filter((d) => d.status === status.key);
    return `
      <div class="kanban-column" data-status="${status.key}">
        <div class="kanban-column-header">
          <span>${status.label}</span>
          <span class="count">${items.length}</span>
        </div>
        <div class="kanban-cards">
          ${items.map(dealCardHtml).join("") || ""}
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = `<div class="kanban">${columns}</div>`;

  container.querySelectorAll("[data-move]").forEach((el) => {
    el.addEventListener("click", () => updateDealStatus(el.dataset.move, el.dataset.status));
  });
  container.querySelectorAll("[data-delete]").forEach((el) => {
    el.addEventListener("click", () => deleteDeal(el.dataset.delete));
  });
}

async function loadClientsForSelect() {
  const clients = await apiRequest("/clients");
  clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));
  clientSelect.innerHTML = clients.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

async function loadDeals() {
  try {
    await loadClientsForSelect();

    if (filterClientId) {
      const client = clientsById[filterClientId];
      subtitle.textContent = client ? `Deals for ${client.name}` : "Deals for this client";
    } else {
      subtitle.textContent = "Your full pipeline.";
    }

    const path = filterClientId ? `/deals?client_id=${filterClientId}` : "/deals";
    const deals = await apiRequest(path);
    renderKanban(deals);
  } catch (err) {
    container.innerHTML = `<div class="card empty-state"><p>Failed to load deals.</p></div>`;
    showToast(err.message);
  }
}

async function updateDealStatus(id, status) {
  try {
    await apiRequest(`/deals/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await loadDeals();
  } catch (err) {
    showToast(err.message);
  }
}

async function deleteDeal(id) {
  if (!confirm("Delete this deal?")) return;
  try {
    await apiRequest(`/deals/${id}`, { method: "DELETE" });
    showToast("Deal deleted", "success");
    await loadDeals();
  } catch (err) {
    showToast(err.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    client_id: Number(clientSelect.value),
    title: titleField.value.trim(),
    amount: amountField.value ? Number(amountField.value) : null,
  };
  const saveBtn = document.getElementById("deal-save-btn");
  saveBtn.disabled = true;

  try {
    await apiRequest("/deals", { method: "POST", body: JSON.stringify(payload) });
    showToast("Deal created", "success");
    closeModal();
    await loadDeals();
  } catch (err) {
    showToast(err.message);
  } finally {
    saveBtn.disabled = false;
  }
});

loadDeals();
