const API_URL = "";
let token = "";
let barChart = null;
let pieChart = null;

window.onload = () => {
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("loading").classList.add("hidden");

  // Data no header
  const now = new Date();
  const dashDate = document.getElementById("dashDate");
  if (dashDate) {
    dashDate.innerText = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
};

function showLoginFeedback(msg, type) {
  const el = document.getElementById("loginFeedback");
  el.innerText = msg;
  el.className = type;
}

function showModalFeedback(msg, type) {
  const el = document.getElementById("modalFeedback");
  el.innerText = msg;
  el.className = type;
}

function showLoading(show) {
  document.getElementById("loading").classList.toggle("hidden", !show);
}

async function login() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showLoginFeedback("Preencha o email e a senha.", "error");
    return;
  }

  const btn = document.getElementById("loginBtn");
  btn.querySelector("span").innerText = "Entrando...";
  btn.disabled = true;
  showLoading(true);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      showLoginFeedback("Email ou senha inválidos.", "error");
      return;
    }

    const data = await res.json();
    token = data.token;

    const nomeExibido = name || data.name || data.user?.name || "Usuário";

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("welcomeMsg").innerText = `Olá, ${nomeExibido} 👋`;
    document.getElementById("sidebarUser").innerText = nomeExibido;

    document.getElementById("openModalBtn").onclick = () => {
      carregarCategorias();
      document.getElementById("modal").classList.remove("hidden");
    };
    document.getElementById("closeModalBtn").onclick = () => {
      document.getElementById("modal").classList.add("hidden");
    };

    carregar();
  } catch (err) {
    showLoginFeedback("Erro de conexão. Tente novamente.", "error");
  } finally {
    btn.querySelector("span").innerText = "Entrar";
    btn.disabled = false;
    showLoading(false);
  }
}

async function carregarCategorias() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const categorias = await res.json();
    const select = document.getElementById("catInput");
    select.innerHTML = '<option value="">Selecione uma categoria</option>';
    categorias.forEach(cat => {
      select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
  } catch {
    showModalFeedback("Erro ao carregar categorias.", "error");
  }
}

function logout() {
  token = "";
  barChart = null;
  pieChart = null;
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("loginFeedback").innerText = "";
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
}

async function carregar() {
  showLoading(true);
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    let receitas = 0, despesas = 0, categorias = {};
    const tbody = document.getElementById("transactionsBody");
    tbody.innerHTML = "";

    data.forEach(t => {
      const type = (t.type ?? "").toUpperCase();
      const isReceita = type === "INCOME" || type === "RECEITA";
      if (isReceita) receitas += t.amount; else despesas += t.amount;

      const cat = t.category ?? "Outros";
      categorias[cat] = (categorias[cat] || 0) + t.amount;

      tbody.innerHTML += `
        <tr>
          <td>${t.description}</td>
          <td class="${isReceita ? 'td-income' : 'td-expense'}">
            ${isReceita ? '+' : '-'} R$ ${t.amount.toFixed(2)}
          </td>
          <td>
            <span class="badge ${isReceita ? 'badge-income' : 'badge-expense'}">
              ${isReceita ? 'Receita' : 'Despesa'}
            </span>
          </td>
          <td>${cat}</td>
          <td>
            <button class="del-btn" onclick="deletar(${t.id})">🗑 Deletar</button>
          </td>
        </tr>`;
    });

    const saldo = receitas - despesas;
    document.getElementById("receitas").innerText = "R$ " + receitas.toFixed(2);
    document.getElementById("despesas").innerText = "R$ " + despesas.toFixed(2);
    document.getElementById("saldo").innerText = (saldo >= 0 ? "R$ " : "- R$ ") + Math.abs(saldo).toFixed(2);

    drawCharts(receitas, despesas, categorias);
  } catch {
    showLoginFeedback("Erro ao carregar dados.", "error");
  } finally {
    showLoading(false);
  }
}

async function deletar(id) {
  if (!confirm("Tem certeza que quer deletar essa transação?")) return;
  showLoading(true);
  try {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) { alert("Erro ao deletar."); return; }
    carregar();
  } catch {
    alert("Erro de conexão.");
  } finally {
    showLoading(false);
  }
}

function drawCharts(receitas, despesas, categorias) {
  const barCtx = document.getElementById("barChart");
  const pieCtx = document.getElementById("pieChart");

  if (barChart) { barChart.destroy(); barChart = null; }
  if (pieChart) { pieChart.destroy(); pieChart = null; }

  Chart.defaults.color = "#7b8091";
  Chart.defaults.font.family = "DM Sans";

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        data: [receitas, despesas],
        backgroundColor: ["rgba(0,245,160,0.7)", "rgba(255,77,109,0.7)"],
        borderColor: ["#00f5a0", "#ff4d6d"],
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#7b8091" } },
        y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#7b8091" } }
      }
    }
  });

  const labels = Object.keys(categorias);
  const values = Object.values(categorias);

  if (labels.length > 0) {
    pieChart = new Chart(pieCtx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ["#00f5a0","#00d4ff","#ff4d6d","#ffd166","#a855f7","#06d6a0"],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#7b8091", padding: 16, usePointStyle: true }
          }
        },
        cutout: "65%"
      }
    });
  }
}

async function addTransaction() {
  const desc = document.getElementById("descInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);
  const type = document.getElementById("typeInput").value;
  const cat = document.getElementById("catInput").value.trim();

  if (!desc || isNaN(amount) || !cat) {
    showModalFeedback("Preencha todos os campos.", "error");
    return;
  }

  showLoading(true);

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ description: desc, amount, type, categoryName: cat })
    });

    if (!res.ok) {
      showModalFeedback("Erro ao salvar transação.", "error");
      return;
    }

    showModalFeedback("Transação salva! ✓", "success");
    document.getElementById("descInput").value = "";
    document.getElementById("amountInput").value = "";

    setTimeout(() => {
      document.getElementById("modal").classList.add("hidden");
      document.getElementById("modalFeedback").innerText = "";
      carregar();
    }, 1200);

  } catch {
    showModalFeedback("Erro de conexão.", "error");
  } finally {
    showLoading(false);
  }
}