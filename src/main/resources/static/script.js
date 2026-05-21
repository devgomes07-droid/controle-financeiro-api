// script.js
const API_URL = "https://controle-financeiro-api-kwcz.onrender.com";
let token = "";
let barChart = null;
let pieChart = null;

// AUTO LOGIN
window.onload = () => {
    token = localStorage.getItem("token");
    if (token) {
        document.getElementById("loginBox").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
        carregar();
    }
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
        localStorage.setItem("token", token);

        document.getElementById("loginBox").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
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

            const cat = t.category ?? "Sem categoria";
            categorias[cat] = (categorias[cat] || 0) + 1;

            tbody.innerHTML += `
                <tr>
                    <td>${t.description ?? "-"}</td>
                    <td>${t.amount ?? 0}</td>
                    <td>${tipo}</td>
                    <td>${cat