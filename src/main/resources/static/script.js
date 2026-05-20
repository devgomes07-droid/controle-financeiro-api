const API_URL = "http://localhost:8080";

let token = "";
let barChart;
let pieChart;

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
        alert("Erro no login");
    } finally {
        btn.innerText = "Entrar";
        btn.disabled = false;
    }
}

// CARREGAR DADOS
async function carregar() {

    const res = await fetch(`${API_URL}/transactions`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    let receitas = 0;
    let despesas = 0;

    const categorias = {};

    const tbody = document.getElementById("transactionsBody");
    tbody.innerHTML = "";

    data.forEach(t => {

        const tipo = t.type.includes("RECEITA") ? "Receita" : "Despesa";

        if (tipo === "Receita") receitas += t.amount;
        else despesas += t.amount;

        const cat = t.category ?? "Sem categoria";
        categorias[cat] = (categorias[cat] || 0) + 1;

        tbody.innerHTML += `
        <tr>
            <td>${t.description}</td>
            <td>${t.amount}</td>
            <td>${tipo}</td>
            <td>${cat}</td>
        </tr>
        `;
    });

    document.getElementById("receitas").innerText = "R$ " + receitas;
    document.getElementById("despesas").innerText = "R$ " + despesas;

    drawCharts(receitas, despesas, categorias);
}

// GRÁFICOS
function drawCharts(receitas, despesas, categorias) {

    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();

    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: ["Receitas", "Despesas"],
            datasets: [{
                data: [receitas, despesas],
                backgroundColor: ["#00ff88", "#ff4d4d"]
            }]
        }
    });

    pieChart = new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: ["#00d4ff", "#00ff88", "#ff4d4d", "#ffcc00"]
            }]
        }
    });
}