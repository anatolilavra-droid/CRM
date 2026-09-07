import { apiRequest, requireAuth, showToast, initials, renderTopbar } from "./api.js";

requireAuth();
renderTopbar("clients");

const container = document.getElementById("clients-container");
const modal = document.getElementById("client-modal");
const modalTitle = document.getElementById("client-modal-title");
const form = document.getElementById("client-form");
const idField = document.getElementById("client-id");
const nameField = document.getElementById("client-name");
const emailField = document.getElementById("client-email");
const phoneField = document.getElementById("client-phone");

function openModal(client = null) {
  form.reset();
  if (client) {
    modalTitle.textContent = "Edit client";
    idField.value = client.id;
    nameField.value = client.name;
    emailField.value = client.email ?? "";
    phoneField.value = client.phone ?? "";
  } else {
    modalTitle.textContent = "New client";
    idField.value = "";
  }
  modal.classList.add("visible");
  nameField.focus();
}

function closeModal() {
  modal.classList.remove("visible");
}

document.getElementById("new-client-btn").addEventListener("click", () => openModal());
document.getElementById("client-modal-close").addEventListener("click", closeModal);
document.getElementById("client-cancel-btn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function renderClients(clients) {
  if (clients.length === 0) {
    container.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon">👥</div>
        <p>No clients yet. Add your first one to get started.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="client-grid">${clients.map(clientCardHtml).join("")}</div>`;

  container.querySelectorAll("[data-view-deals]").forEach((el) => {
    el.addEventListener("click", () => {
      window.location.href = `deals.html?client_id=${el.dataset.viewDeals}`;
    });
  });
  container.querySelectorAll("[data-edit]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const client = clients.find((c) => String(c.id) === el.dataset.edit);
      openModal(client);
    });
  });
  container.querySelectorAll("[data-delete]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteClient(el.dataset.delete);
    });
  });
}

function clientCardHtml(client) {
  return `
    <div class="card client-card" data-view-deals="${client.id}">
      <div class="client-card-top">
        <div class="client-avatar">${initials(client.name)}</div>
      </div>
      <div class="client-name">${escapeHtml(client.name)}</div>
      <div class="client-meta">
        ${client.email ? `<span>${escapeHtml(client.email)}</span>` : ""}
        ${client.phone ? `<span>${escapeHtml(client.phone)}</span>` : ""}
      </div>
      <div class="client-card-actions">
        <button class="btn btn-secondary btn-sm" data-edit="${client.id}">Edit</button>
        <button class="btn btn-danger-ghost btn-sm" data-delete="${client.id}">Delete</button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadClients() {
  try {
    const clients = await apiRequest("/clients");
    renderClients(clients);
  } catch (err) {
    container.innerHTML = `<div class="card empty-state"><p>Failed to load clients.</p></div>`;
    showToast(err.message);
  }
}

async function deleteClient(id) {
  if (!confirm("Delete this client? This is only possible if they have no deals.")) return;
  try {
    await apiRequest(`/clients/${id}`, { method: "DELETE" });
    showToast("Client deleted", "success");
    await loadClients();
  } catch (err) {
    showToast(err.message);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: nameField.value.trim(),
    email: emailField.value.trim() || null,
    phone: phoneField.value.trim() || null,
  };
  const id = idField.value;
  const saveBtn = document.getElementById("client-save-btn");
  saveBtn.disabled = true;

  try {
    if (id) {
      await apiRequest(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      showToast("Client updated", "success");
    } else {
      await apiRequest("/clients", { method: "POST", body: JSON.stringify(payload) });
      showToast("Client created", "success");
    }
    closeModal();
    await loadClients();
  } catch (err) {
    showToast(err.message);
  } finally {
    saveBtn.disabled = false;
  }
});

loadClients();
