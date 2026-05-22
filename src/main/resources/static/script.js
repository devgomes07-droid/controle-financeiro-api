const API_URL = "";
let token = "";
let barChart = null;
let pieChart = null;

window.onload = () => {
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("loading").classList.add("hidden");
};

function showLoginFeedback(msg, type) {
  const feedback = document.getElementById("loginFeedback");
  feedback.innerText = msg;
  feedback.className = type;
}

function showModalFeedback(msg, type) {
  const feedback = document.getElementById("modalFeedback");
  feedback.innerText = msg;
  feedback.className = type;
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
      showLoginFeedback("Email ou senha inválidos.", "error");
      return;
    }

    const data = await res.json();
    token = data.token;

    const nomeExibido = name || data.name || data.user?.name || "Usuário";

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("welcomeMsg").innerText = `👋 Olá, ${nomeExibido}! Bem-vindo ao seu painel financeiro.`;

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
    btn.innerText = "Entrar";
    btn.disabled = false;
    showLoading(false);
  }
}

// ✅ Carrega categorias do banco e popula o select
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
          <td ${isReceita ? "style='color:green'" : "style='color:red'"}>R$ ${t.amount.toFixed(2)}</td>
          <td>${isReceita ? "Receita" : "Despesa"}</td>
          <td>${cat}</td>
          <td>
            <button onclick="deletar(${t.id})" style="background:#ff4d4d;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑 Deletar</button>
          </td>
        </tr>`;
    });

    document.getElementById("receitas").innerText = "R$ " + receitas.toFixed(2);
    document.getElementById("despesas").innerText = "R$ " + despesas.toFixed(2);
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

    if (!res.ok) {
      alert("Erro ao deletar transação.");
      return;
    }

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

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{ data: [receitas, despesas], backgroundColor: ["#00ff88", "#ff4d4d"] }]
    },
    options: { plugins: { legend: { display: false } } }
  });

  const labelsCategoria = Object.keys(categorias);
  const valoresCategoria = Object.values(categorias);

  if (labelsCategoria.length > 0) {
    pieChart = new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: labelsCategoria,
        datasets: [{
          data: valoresCategoria,
          backgroundColor: ["#00d4ff", "#00ff88", "#ff4d4d", "#ffcc00", "#a66bff"]
        }]
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

    showModalFeedback("Transação salva com sucesso!", "success");
    document.getElementById("descInput").value = "";
    document.getElementById("amountInput").value = "";
    document.getElementById("catInput").value = "";

    setTimeout(() => {
      document.getElementById("modal").classList.add("hidden");
      document.getElementById("modalFeedback").innerText = "";
    }, 1500);

    carregar();
  } catch {
    showModalFeedback("Erro de conexão.", "error");
  } finally {
    showLoading(false);
  }
}
