# 💰 Controle Financeiro API

API REST de controle financeiro desenvolvida com Spring Boot, JPA e Spring Security.

## 🚀 Tecnologias

- Java 21
- Spring Boot 3.5
- Spring Security + JWT
- Spring Data JPA
- H2 Database (testes)
- PostgreSQL (produção)
- Maven

## 📋 Funcionalidades

- Cadastro e autenticação de usuários
- Gerenciamento de transações financeiras
- Categorização de receitas e despesas
- Relatórios por período

## ▶️ Como rodar localmente

```bash
git clone https://github.com/devgomes07-droid/controle-financeiro-api.git
cd controle-financeiro-api
./mvnw spring-boot:run
```

## 📌 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /users | Lista todos os usuários |
| GET | /users/{id} | Busca usuário por ID |
| POST | /users | Cria novo usuário |
| PUT | /users/{id} | Atualiza usuário |
| DELETE | /users/{id} | Remove usuário |

## 👨‍💻 Autor

Gabriel — [GitHub](https://github.com/devgomes07-droid)
