const API_URL = "";

let token = "";
let barChart = null;
let pieChart = null;
let transactionsCache = [];

const descriptionRules = {
  "Salário": { type: "RECEITA", category: "Salário" },
  "Freelance": { type: "RECEITA", category: "Freelance" },
  "Rendimento": { type: "RECEITA", category: "Investimento" },
  "Dividendos": { type: "RECEITA", category: "Investimento" },

  "Mercado": { type: "DESPESA", category: "Alimentação" },
  "Almoço": { type: "DESPESA", category: "Alimentação" },
  "Jantar": { type: "DESPESA", category: "Alimentação" },
  "Lanche": { type: "DESPESA", category: "Alimentação" },
  "Padaria": { type: "DESPESA", category: "Alimentação" },

  "Uber": { type: "DESPESA", category: "Transporte" },
  "Ônibus": { type: "DESPESA", category: "Transporte" },
  "Combustível": { type: "DESPESA", category: "Transporte" },
  "Estacionamento": { type: "DESPESA", category: "Transporte" },

  "Academia": { type: "DESPESA", category: "Saúde" },
  "Farmácia": { type: "DESPESA", category: "Saúde" },
  "Consulta": { type: "DESPESA", category: "Saúde" },

  "Aluguel": { type: "DESPESA", category: "Moradia" },
  "Condomínio": { type: "DESPESA", category: "Moradia" },
  "Energia": { type: "DESPESA", category: "Moradia" },
  "Internet": { type: "DESPESA", category: "Moradia" },

  "Cinema": { type: "DESPESA", category: "Lazer" },
  "Streaming": { type: "DESPESA", category: "Lazer" },
  "Viagem": { type: "DESPESA", category: "Lazer" },

  "Curso": { type: "DESPESA", category: "Educação" },
  "Faculdade": { type: "DESPESA", category: "Educação" },
  "Livro": { type: "DESPESA", category: "Educação" },

  "Roupa": { type: "DESPESA", category: "Vestuário" },
  "Tênis": { type: "DESPESA", category: "Vestuário" }
};

const defaultCategories = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Moradia",
  "Investimento",
  "Vestuário",
  "Salário",
  "Freelance"
];

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

  document.getElementById("closeModalBtn").onclick = fecharModal;
  atualizarSugestoesDescricao();
  preencherCategorias(defaultCategories);
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

  document.getElementById("descInput").value = "";
  document.getElementById("amountInput").value = "";
  document.getElementById("typeInput").value = "DESPESA";
  document.getElementById("catInput").value = "";
  document.getElementById("modalFeedback").innerText = "";
  document.getElementById("modal").classList.remove("hidden");
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function removerAcentos(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarChave(value) {
  return removerAcentos(value).trim().replace(/\s+/g, " ").toLowerCase();
}

function padronizarDescricao(value) {
  const key = normalizarChave(value);
  const found = Object.keys(descriptionRules).find(desc => normalizarChave(desc) === key);

  if (found) return found;

  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|\s|[-/])(\p{L})/gu, (match, sep, letter) => sep + letter.toUpperCase());
}

function getDescriptionRule(description) {
  const key = normalizarChave(description);
  const found = Object.keys(descriptionRules).find(desc => normalizarChave(desc) === key);
  return found ? { description: found, ...descriptionRules[found] } : null;
}

function safeAmount(value) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
  return safeAmount(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function isReceita(type) {
  const t = String(type ?? "").toUpperCase().trim();
  return t === "RECEITA" || t === "INCOME" || t === "R" || t === "ENTRADA";
}

function preencherCategorias(categories) {
  const select = document.getElementById("catInput");
  const merged = [...new Set([...defaultCategories, ...categories].filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  select.innerHTML = '<option value="">Selecione uma categoria</option>';

  merged.forEach(category => {
    select.innerHTML += `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
  });
}

function atualizarSugestoesDescricao() {
  const datalist = document.getElementById("descSuggestions");
  const defaults = Object.keys(descriptionRules);

  const fromTransactions = transactionsCache
    .map(t => padronizarDescricao(t.description))
    .filter(desc => getDescriptionRule(desc));

  const descriptions = [...new Set([...defaults, ...fromTransactions])]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  datalist.innerHTML = descriptions
    .map(desc => `<option value="${escapeHtml(desc)}"></option>`)
    .join("");
}

function aplicarRegraDescricao(forceNormalize = false) {
  const descInput = document.getElementById("descInput");
  const typeInput = document.getElementById("typeInput");
  const catInput = document.getElementById("catInput");

  const normalized = padronizarDescricao(descInput.value);
  const rule = getDescriptionRule(normalized);

  if (forceNormalize) descInput.value = normalized;

  if (!rule) return;

  descInput.value = rule.description;
  typeInput.value = rule.type;
  catInput.value = rule.category;
  showModalFeedback("", "");
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
  } catch {
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
    const apiCategories = Array.isArray(categorias)
      ? categorias.map(cat => cat.name).filter(Boolean)
      : [];

    preencherCategorias(apiCategories);
  } catch {
    preencherCategorias(defaultCategories);
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

  atualizarSugestoesDescricao();
}

async function carregar() {
  showLoading(true);

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Erro ao buscar transações");

    const data = await res.json();
    const rawTransactions = Array.isArray(data) ? data : [];

    const uniqueMap = new Map();

    rawTransactions.forEach(t => {
      const desc = padronizarDescricao(t.description);
      const amount = safeAmount(t.amount);
      const type = isReceita(t.type) ? "RECEITA" : "DESPESA";
      const category = t.category ?? t.categoryName ?? "Outros";
      const key = `${desc}|${amount}|${type}|${category}|${t.id}`;

      uniqueMap.set(key, {
        ...t,
        description: desc,
        amount,
        type,
        category
      });
    });

    transactionsCache = [...uniqueMap.values()];

    let receitas = 0;
    let despesas = 0;
    const categorias = {};
    const tbody = document.getElementById("transactionsBody");

    tbody.innerHTML = "";

    if (transactionsCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table">Nenhuma transação encontrada.</td>
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
      const cat = t.category ?? "Outros";
      const desc = padronizarDescricao(t.description) || "-";

      if (rec) receitas += amt;
      else despesas += amt;

      if (!rec) {
        categorias[cat] = (categorias[cat] || 0) + amt;
      }

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

    if (falhou) alert("Algumas transações não puderam ser deletadas.");

    await carregar();
    atualizarSugestoesDescricao();
  } catch {
    alert("Erro ao resetar transações.");
  } finally {
    showLoading(false);
  }
}

function drawCharts(receitas, despesas, categorias) {
  const barCanvas = document.getElementById("barChart");
  const pieCanvas = document.getElementById("pieChart");

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  Chart.defaults.color = "#a4aabb";
  Chart.defaults.font.family = "DM Sans, sans-serif";

  const barGradientIncome = barCanvas.getContext("2d").createLinearGradient(0, 0, 0, 260);
  barGradientIncome.addColorStop(0, "rgba(0,245,160,0.9)");
  barGradientIncome.addColorStop(1, "rgba(0,245,160,0.22)");

  const barGradientExpense = barCanvas.getContext("2d").createLinearGradient(0, 0, 0, 260);
  barGradientExpense.addColorStop(0, "rgba(255,77,109,0.9)");
  barGradientExpense.addColorStop(1, "rgba(255,77,109,0.22)");

  barChart = new Chart(barCanvas, {
    type: "bar",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [{
        data: [receitas, despesas],
        backgroundColor: [barGradientIncome, barGradientExpense],
        borderColor: ["#00f5a0", "#ff4d6d"],
        borderWidth: 2,
        borderRadius: 14,
        maxBarThickness: 82
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#171a22",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: context => formatMoney(context.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#a4aabb", font: { size: 13, weight: "700" } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: {
            color: "#8d93a5",
            callback: value => formatMoney(value)
          }
        }
      }
    }
  });

  const labels = Object.keys(categorias);
  const values = Object.values(categorias).map(safeAmount);

  if (labels.length === 0) {
    pieChart = new Chart(pieCanvas, {
      type: "doughnut",
      data: {
        labels: ["Sem despesas"],
        datasets: [{
          data: [1],
          backgroundColor: ["rgba(255,255,255,0.08)"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false }
        }
      }
    });
    return;
  }

  pieChart = new Chart(pieCanvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, index) => chartColors[index % chartColors.length]),
        borderColor: "#111318",
        borderWidth: 4,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      animation: { duration: 700 },
      plugins: {
        tooltip: {
          backgroundColor: "#171a22",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: context => `${context.label}: ${formatMoney(context.raw)}`
          }
        },
        legend: {
          position: "bottom",
          labels: {
            color: "#b7bdcc",
            padding: 18,
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 10,
            boxHeight: 10,
            font: {
              size: 13,
              weight: "700"
            }
          }
        }
      }
    }
  });
}

async function addTransaction() {
  const rawDesc = document.getElementById("descInput").value;
  const desc = padronizarDescricao(rawDesc);
  const amount = safeAmount(document.getElementById("amountInput").value);
  const rule = getDescriptionRule(desc);

  if (!rule) {
    showModalFeedback("Escolha uma descrição válida da lista.", "error");
    return;
  }

  if (amount <= 0) {
    showModalFeedback("Informe um valor maior que zero.", "error");
    return;
  }

  document.getElementById("descInput").value = rule.description;
  document.getElementById("typeInput").value = rule.type;
  document.getElementById("catInput").value = rule.category;

  showLoading(true);

  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        description: rule.description,
        amount,
        type: rule.type,
        categoryName: rule.category
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Erro API:", errText);
      showModalFeedback("Erro ao salvar transação.", "error");
      return;
    }

    showModalFeedback("Transação salva!", "success");

    setTimeout(() => {
      fecharModal();
      carregar();
    }, 800);
  } catch (e) {
    console.error(e);
    showModalFeedback("Erro de conexão.", "error");
  } finally {
    showLoading(false);
  }
}