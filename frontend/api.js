const TOKEN_KEY = "crm_token";
const USER_KEY = "crm_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("Network error calling", path, err);
    throw new Error("Network error — is the server running?");
  }

  if (res.status === 401) {
    clearSession();
    window.location.href = "index.html";
    throw new Error("Session expired");
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = body?.error || `Request failed (${res.status})`;
    console.error("API error:", path, res.status, message);
    throw new Error(message);
  }

  return body;
}

function showToast(message, type = "error") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function getDealSuggestion(dealId) {
  const data = await apiRequest("/ai/suggest-action", {
    method: "POST",
    body: JSON.stringify({ deal_id: dealId }),
  });
  return data.suggestion;
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function renderTopbar(activePage) {
  const user = getUser();
  const el = document.getElementById("topbar");
  if (!el) return;
  el.innerHTML = `
    <div class="topbar-brand"><span class="logo-dot"></span>CRM</div>
    <nav class="topbar-nav">
      <a href="clients.html" class="${activePage === "clients" ? "active" : ""}">Clients</a>
      <a href="deals.html" class="${activePage === "deals" ? "active" : ""}">Deals</a>
    </nav>
    <div class="topbar-user">
      <span class="user-email">${user?.email ?? ""}</span>
      <button class="btn btn-secondary btn-sm" id="logout-btn">Log out</button>
    </div>
  `;
  document.getElementById("logout-btn").addEventListener("click", logout);
}

export {
  apiRequest,
  requireAuth,
  setSession,
  clearSession,
  getUser,
  logout,
  showToast,
  initials,
  renderTopbar,
  getDealSuggestion,
};
