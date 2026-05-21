const API_URL = "https://controle-financeiro-api-kwcz.onrender.com";
let token = "";
let barChart = null;
let pieChart = null;

window.onload = () => {
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("loading").classList.add("hidden");
};

async function login() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  btn.innerText = "Entrando...";
  btn.disabled = true;
  showLoading(true);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      showLoginFeedback("Login inválido", "error");
      return;
    }

    const data = await res.json();
    token = data.token;

    document.getElementById("