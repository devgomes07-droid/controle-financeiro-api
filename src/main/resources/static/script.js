const API_URL = "https://controle-financeiro-api-kwcz.onrender.com";
let token = "";
let barChart = null;
let pieChart = null;

// LOGIN sempre obrigatório
window.onload = () => {
  // ao iniciar, mostra apenas login
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
};

// LOGIN
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
      showFeedback("Login inválido", "error");
      return;
    }

    const data = await res.json();
    token = data.token;

    // libera dashboard
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    document.getElementById("welcomeMsg").innerText = `👋 Olá, ${name}! Bem-vindo ao seu painel financeiro.`;

    // só agora habilita o botão de nova transação
    document.getElementById("openModalBtn").onclick = () => {
      document.getElementById("modal").classList.remove("hidden");
    };
    document.getElementById("closeModalBtn").onclick = () => {
      document.getElementById("modal").classList.add("hidden");
    };

    carregar();

  } catch (err) {
    console.error(err);
    showFeedback("Erro no login", "error");
  } finally {
    btn.innerText = "Entrar";
    btn.disabled = false;
    showLoading(false);
  }
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  token = "";
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
}

// CARREGAR DADOS
async function carregar() {
  showLoading(true);
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar transações");

    const data = await res.json();
    let receitas = 0;
    let despesas = 0;
    const categorias = {};
    const tbody = document.getElementById("transactionsBody");
    tbody.innerHTML = "";

    data.forEach(t => {
      if (!t) return;
      const type = (t.type ?? "").toUpperCase();
      const isReceita = type === "INCOME";
      const tipo = isReceita ? "Receita" : "Despesa";

      if (isReceita) receitas += t.amount || 0;
      else despesas += t.amount || 0;

      const cat = t.category?.name ?? "Outros";
      categorias[cat] = (categorias[cat] || 0) + (t.amount || 0);

      const valorFormatado = (t.amount ?? 0).toFixed(2);
      const cor = isReceita ? "style='color:green'" : "style='color:red'";

      tbody.innerHTML += `
        <tr>
          <td>${t.description ?? "-"}</td>
          <td ${cor}>R$ ${valorFormatado}</td>
          <td>${tipo}</td>
          <td>${cat}</td>
        </tr>
      `;
    });

    document.getElementById("receitas").innerText = "R$ " + receitas.toFixed(2);
    document.getElementById("despesas").innerText = "R$ " + despesas.toFixed(2);
    drawCharts(receitas, despesas, categorias);

  } catch (err) {
    console.error(err);
    showFeedback("Erro ao carregar dados", "error");
  } finally {
    showLoading(false);
  }
}

// GRÁFICOS
function drawCharts(receitas, despesas, categorias) {
  const barCtx = document.getElementById("barChart");
  const pieCtx = document.getElementById("pieChart");
  if (!barCtx || !pieCtx) return;

  if (!barChart) {
    barChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: ["Receitas", "Despesas"],
        datasets: [{
          data: [receitas, despesas],
          backgroundColor: ["#00ff88", "#ff4d4d"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `R$ ${ctx.raw.toFixed(2)}` } }
        }
      }
    });
  } else {
    barChart.data.datasets[0].data = [receitas, despesas];
    barChart.update();
  }

  if (!pieChart) {
    pieChart = new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: Object.keys(categorias),
        datasets: [{
          data: Object.values(categorias),
          backgroundColor: ["#00d4ff", "#00ff88", "#ff4d4d", "#ffcc00", "#a66bff"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { callbacks: { label: ctx => `${ctx.label}: R$ ${ctx.raw.toFixed(2)}` } }
        }
      }
    });
  } else {
    pieChart.data.labels = Object.keys(categorias);
    pieChart.data.datasets[0].data = Object.values(categorias);
    pieChart.update();
  }
}

// ADICIONAR TRANSAÇÃO
async function addTransaction() {
  const desc = document.getElementById("descInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);
  const type = document.getElementById("typeInput").value; // RECEITA ou DESPESA
  const catId = parseInt(document.getElementById("catInput").value); // ID da categoria
  const userId = 1; // exemplo fixo, depois pegar do login

  if (!token) {
    showFeedback("⚠️ Faça login antes de salvar transações", "error");
    return;
  }

  if (!desc || isNaN(amount) || amount <= 0 || !type || isNaN(catId)) {
    showFeedback("Preencha todos os campos corretamente", "error");
    return;
  }

  const backendType = type === "RECEITA" ? "INCOME" : "EXPENSE";

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        description: desc,
        amount: amount,
        type: backendType,
        categoryId: catId,
        userId: userId
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro backend:", errorText);
      throw new Error("Erro ao adicionar transação");
    }

    showFeedback("✅ Transação adicionada com sucesso!", "success");
    document.getElementById("modal").classList.add("hidden");
    carregar();

  } catch (err) {
    console.error(err);
    showFeedback("❌ Erro ao salvar transação", "error");
  }
}

// FEEDBACK
function showFeedback(msg, type) {
  const feedback = document.getElementById("feedbackMsg");
  feedback.innerText = msg;
  feedback.className = type; // aplica CSS .success ou .error
}

// LOADING
function showLoading(state) {
  const loading = document.getElementById("loading");
  if (state) loading.classList.remove("hidden");
  else loading.classList.add("hidden");
}
