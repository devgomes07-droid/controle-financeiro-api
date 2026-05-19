const API_URL = "https://controle-financeiro-api-kwcz.onrender.com";

let token = "";

let barChart;
let pieChart;

// LOGIN
async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            alert("Login inválido");
            return;
        }

        const data = await res.json();

        token = data.token || data.jwt || data.accessToken;

        if (!token) {
            alert("Token não retornado pelo backend");
            console.log(data);
            return;
        }

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        carregar();

    } catch (err) {
        console.error(err);
        alert("Erro no login");
    }
}

// CARREGAR TRANSAÇÕES
async function carregar() {

    try {

        const res = await fetch(`${API_URL}/transactions`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            alert("Erro ao carregar transações: " + res.status);
            return;
        }

        const data = await res.json();

        let receitas = 0;
        let despesas = 0;

        const categorias = {};

        const tbody = document.getElementById("transactionsBody");
        tbody.innerHTML = "";

        data.forEach(t => {

            const tipo =
                t.type === "RECEITA" || t.type === "INCOME"
                    ? "Receita"
                    : "Despesa";

            if (tipo === "Receita") receitas += t.amount;
            else despesas += t.amount;

            categorias[t.category] = (categorias[t.category] || 0) + 1;

            tbody.innerHTML += `
                <tr>
                    <td>${t.description}</td>
                    <td>${t.amount}</td>
                    <td>${tipo}</td>
                    <td>${t.category}</td>
                </tr>
            `;
        });

        document.getElementById("receitas").innerText = "R$ " + receitas;
        document.getElementById("despesas").innerText = "R$ " + despesas;

        drawCharts(receitas, despesas, categorias);

    } catch (err) {
        console.error(err);
        alert("Erro ao carregar dados");
    }
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
                data: [receitas, despesas]
            }]
        }
    });

    pieChart = new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                data: Object.values(categorias)
            }]
        }
    });
}