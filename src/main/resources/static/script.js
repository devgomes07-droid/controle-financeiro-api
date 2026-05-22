const API_URL = "";

let token = "";
let barChart = null;
let pieChart = null;
let transactionsCache = [];

const chartColors = [
  "#00f5a0",
  "#ff4d6d",
  "#00d4ff",
  "#ffd166",
  "#a855f7",
  "#ff8c42",
  "#4cc9f0",
  "#f72585",
  "#90be6d",
  "#f8961e",
  "#43aa8b",
  "#577590"
];

window.onload = () => {
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("loading").classList.add("hidden");

  const dashDate = document.getElementById("dashDate");
  if (dashDate) {
    dashDate.innerText = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) {
    closeModalBtn.onclick = fecharModal;
  }
};

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebarOverlay").classList.toggle("open");
}

function fecharSidebarMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("open");
}

function abrirModal() {
  fecharSidebarMobile();
  carregarCategorias();
  atualizarSugestoesDescricao();
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modalFeedback").innerText = "";
}

function fecharModal() {
  document.getElementById("modal").classList.add("hidden");
}

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

function formatMoney(value) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return safeValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function safeAmount(value) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "string") {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function padronizarDescricao(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|\s|[-/])(\p{L})/gu, (match, sep, letter) => sep + letter.toUpperCase());
}

function normalizeDescriptionInput() {
  const input = document.getElementById("descInput");
  input.value = padronizarDescricao(input.value);
}

function atualizarSugestoesDescricao() {
  const datalist = document.getElementById("descSuggestions");
  const descricoes = [...new Set(
    transactionsCache
      .map(t => padronizarDescricao(t.description))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pt-BR"));

  datalist.innerHTML = descricoes
    .map(desc => `<option value="${escapeHtml(desc)}"></option>`)
    .join("");
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
  document.getElementById("loginBtnText").innerText = "Entrando...";
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
    document.getElementById("welcomeMsg").innerText = `Olá, ${nomeExibido}`;
    document.getElementById("sidebarUser").innerText = nomeExibido;

    await carregar();
  } catch (err) {
    showLoginFeedback("Erro de conexão. Tente novamente.", "error");
  } finally {
    document.getElementById("loginBtnText").innerText = "Entrar";
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

    if (Array.isArray(categorias)) {
      categorias.forEach(cat => {
        const name = escapeHtml(cat.name);
        select.innerHTML += `<option value="${name}">${name}</option>`;
      });
    }
  } catch {
    showModalFeedback("Erro ao carregar categorias.", "error");
  }
}

function logout() {
  token = "";
  barChart = null;
  pieChart = null;
  transactionsCache = [];

  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("loginFeedback").innerText = "";
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
}

function isReceita(type) {
  const t = String(type ?? "").toUpperCase().trim();
  return t === "RECEITA" || t === "INCOME" || t === "R" || t === "ENTRADA";
}

async function carregar() {
  showLoading(true);

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar transações");

    const data = await res.json();
    transactionsCache = Array.isArray(data) ? data : [];

    let receitas = 0;
    let despesas = 0;
    const categorias = {};
    const tbody = document.getElementById("transactionsBody");

    tbody.innerHTML = "";

    if (transactionsCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table">
            Nenhuma transação encontrada.
          </td>
        </tr>
      `;

      document.getElementById("receitas").innerText = formatMoney(0);
      document.getElementById("despesas").innerText = formatMoney(0);
      document.getElementById("saldo").innerText = formatMoney(0);

      drawCharts(0, 0, {});
      atualizarSugestoesDescricao();
      return;
    }

    transactionsCache.forEach(t => {
      const rec = isReceita(t.type);
      const amt = safeAmount(t.amount);
      const cat = t.category ?? t.categoryName ?? "Outros";
      const desc = padronizarDescricao(t.description) || "-";

      if (rec) receitas += amt;
      else despesas += amt;

      categorias[cat] = (categorias[cat] || 0) + amt;

      tbody.innerHTML += `
        <tr>
          <td>${escapeHtml(desc)}</td>
          <td class="${rec ? "td-income" : "td-expense"}">
            ${rec ? "+" : "-"} ${formatMoney(amt)}
          </td>
          <td>
            <span class="badge ${rec ? "badge-income" : "badge-expense"}">
              ${rec ? "Receita" : "Despesa"}
            </span>
          </td>
          <td>${escapeHtml(cat)}</td>
          <td>
            <button class="del-btn" onclick="deletar(${t.id})">Deletar</button>
          </td>
        </tr>
      `;
    });

    const saldo = receitas - despesas;

    document.getElementById("receitas").innerText = formatMoney(receitas);
    document.getElementById("despesas").innerText = formatMoney(despesas);
    document.getElementById("saldo").innerText = formatMoney(saldo);

    drawCharts(receitas, despesas, categorias);
    atualizarSugestoesDescricao();
  } catch (e) {
    console.error(e);
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
      alert("Erro ao deletar.");
      return;
    }

    await carregar();
  } catch {
    alert("Erro de conexão.");
  } finally {
    showLoading(false);
  }
}

async function resetarTransacoes() {
  fecharSidebarMobile();

  if (transactionsCache.length === 0) {
    alert("Não há transações para resetar.");
    return;
  }

  const confirmar = confirm(
    `Tem certeza que deseja deletar todas as ${transactionsCache.length} transações? Essa ação não pode ser desfeita.`
  );

  if (!confirmar) return;

  showLoading(true);

  try {
    const deletes = transactionsCache
      .filter(t => t.id !== null && t.id !== undefined)
      .map(t => fetch(`${API_URL}/transactions/${t.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      }));

    const results = await Promise.all(deletes);
    const falhou = results.some(res => !res.ok);

    if (falhou) {
      alert("Algumas transações não puderam ser deletadas.");
    }

    await carregar();
  } catch (e) {
    console.error(e);
    alert("Erro ao resetar transações.");
  } finally {
    showLoading(false);
  }
}

function drawCharts(receitas, despesas, categorias) {
  const barCtx = document.getElementById("barChart");
  const pieCtx = document.getElementById("pieChart");

  if (barChart) {
    barChart.destroy();
    barChart = null;
  }

  if (pieChart) {
    pieChart.destroy();
    pieChart = null;
  }

  Chart.defaults.color = "#8d93a5";
  Chart.defaults.font.family = "DM Sans, sans-serif";

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        data: [receitas, despesas],
        backgroundColor: ["rgba(0,245,160,0.72)", "rgba(255,77,109,0.72)"],
        borderColor: ["#00f5a0", "#ff4d6d"],
        borderWidth: 2,
        borderRadius: 10,
        maxBarThickness: 72
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => formatMoney(safeAmount(context.raw))
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#8d93a5", font: { size: 12, weight: "600" } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "#8d93a5",
            callback: value => formatMoney(safeAmount(value))
          }
        }
      }
    }
  });

  const labels = Object.keys(categorias);
  const values = Object.values(categorias).map(safeAmount);

  if (labels.length === 0) return;

  pieChart = new Chart(pieCtx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, index) => chartColors[index % chartColors.length]),
        borderColor: "#111318",
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${formatMoney(safeAmount(context.raw))}`
          }
        },
        legend: {
          position: "bottom",
          labels: {
            color: "#a4aabb",
            padding: 18,
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 10,
            boxHeight: 10,
            font: {
              size: 13,
              weight: "600"
            }
          }
        }
      }
    }
  });
}

async function addTransaction() {
  const desc = padronizarDescricao(document.getElementById("descInput").value);
  const amount = safeAmount(document.getElementById("amountInput").value);
  const type = document.getElementById("typeInput").value;
  const cat = document.getElementById("catInput").value.trim();

  document.getElementById("descInput").value = desc;

  if (!desc || amount <= 0 || !cat) {
    showModalFeedback("Preencha todos os campos corretamente.", "error");
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
      body: JSON.stringify({
        description: desc,
        amount,
        type,
        categoryName: cat
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Erro API:", errText);
      showModalFeedback("Erro ao salvar transação.", "error");
      return;
    }

    showModalFeedback("Transação salva!", "success");

    document.getElementById("descInput").value = "";
    document.getElementById("amountInput").value = "";

    setTimeout(() => {
      fecharModal();
      document.getElementById("modalFeedback").innerText = "";
      carregar();
    }, 900);
  } catch (e) {
    console.error(e);
    showModalFeedback("Erro de conexão.", "error");
  } finally {
    showLoading(false);
  }
}