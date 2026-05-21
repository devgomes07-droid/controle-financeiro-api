const API_URL = "https://controle-financeiro-api-kwcz.onrender.com";
let token = "";
let barChart = null;
let pieChart = null;

// LOGIN sempre obrigatório
window.onload = () => {
  localStorage.removeItem("token"); // força login sempre
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
};

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");
  btn.innerText = "Entrando...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      alert("Login inválido");
      return;
    }

    const data = await res.json();
    token = data.token;

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    const userName = data.user?.name || email;
    document.getElementById("welcomeMsg").innerText = `Olá, ${userName}, bem-vindo de volta!`;

    carregar();

  } catch (err) {
    console.error(err);
    alert("Erro no login");
  } finally {
    btn.innerText = "Entrar";
    btn.disabled = false;
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
      const isReceita = type === "RECEITA" || type === "INCOME";
      const tipo = isReceita ? "Receita" : "Despesa";

      if (isReceita) receitas += t.amount || 0;
      else despesas += t.amount || 0;

      const cat = t.category ?? "Outros";
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
    alert("Erro ao carregar dados");
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
      options: { responsive: true, plugins: { legend: { display: false } } }
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
      options: { responsive: true }
    });
  } else {
    pieChart.data.labels = Object.keys(categorias);
    pieChart.data.datasets[0].data = Object.values(categorias);
    pieChart.update();
  }
}

// ADICIONAR TRANSAÇÃO
async function addTransaction() {
  const desc = document.getElementById("descInput").value;
  const amount = parseFloat(document.getElementById("amountInput").value);
  const type = document.getElementById("typeInput").value;
  const cat = document.getElementById("catInput").value;

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ description: desc, amount, type, category: cat })
    });

    if (!res.ok) throw new Error("Erro ao adicionar transação");

    alert("Transação adicionada com sucesso!");
    carregar();

  } catch (err) {
    console.error(err);
    alert("Erro ao salvar transação");
  }
}
