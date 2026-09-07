import { apiRequest, setSession, getUser } from "./api.js";

if (getUser()) {
  window.location.href = "clients.html";
}

const tabs = document.querySelectorAll(".auth-tab");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const errorBox = document.getElementById("auth-error");

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("visible");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.remove("visible");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    clearError();
    const isLogin = tab.dataset.tab === "login";
    loginForm.style.display = isLogin ? "block" : "none";
    registerForm.style.display = isLogin ? "none" : "block";
  });
});

function setButtonLoading(button, loading, label) {
  button.disabled = loading;
  button.textContent = loading ? "Please wait…" : label;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const button = document.getElementById("login-submit");

  setButtonLoading(button, true, "Log in");
  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSession(data.token, data.user);
    window.location.href = "clients.html";
  } catch (err) {
    showError(err.message);
  } finally {
    setButtonLoading(button, false, "Log in");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const button = document.getElementById("register-submit");

  setButtonLoading(button, true, "Create account");
  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setSession(data.token, data.user);
    window.location.href = "clients.html";
  } catch (err) {
    showError(err.message);
  } finally {
    setButtonLoading(button, false, "Create account");
  }
});
