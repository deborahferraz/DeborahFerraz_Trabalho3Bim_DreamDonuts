const API_BASE_URL = "http://localhost:3001";
let usuarioLogado = null;
let crudAtual = null; // indica qual CRUD está aberto (produtos, categorias etc.)

document.addEventListener("DOMContentLoaded", async () => {
  await verificarLogin();
  configurarEventListeners();
});

// -------- LOGIN --------
async function verificarLogin() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verificar`, {
      credentials: "include",
    });
    const data = await response.json();

    if (data.logged) {
      usuarioLogado = data;
      document.getElementById("nomeUsuario").textContent =
        `Bem-vindo, ${data.nome_usuario}!`;
    } else {
      usuarioLogado = null;
      document.getElementById("nomeUsuario").textContent = "Não autenticado";
    }
  } catch (error) {
    console.error("Erro ao verificar login:", error);
  }
}

// -------- ABRIR CRUD --------
function abrirCrud(pagina) {
  window.location.href = `../${pagina}/${pagina}.html`; 
  // Ex: produto → "../produto/produto.html"
  //     categoria → "../categoria/categoria.html"
}




function fecharModal() {
  document.getElementById("crudModal").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
}

// -------- CARREGAR ITENS --------
async function carregarItens() {
  if (crudAtual === "produtos") {
    try {
      const res = await fetch(`${API_BASE_URL}/produto`);
      const produtos = await res.json();

      // cabeçalho
      document.getElementById("tableHead").innerHTML = `
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Descrição</th>
          <th>Preço</th>
          <th>Estoque</th>
          <th>Categoria</th>
          <th>Ativo</th>
          <th>Ações</th>
        </tr>
      `;

      // corpo
      const tbody = document.getElementById("tableBody");
      tbody.innerHTML = "";
      produtos.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id_produto}</td>
          <td>${p.nome_produto}</td>
          <td>${p.descricao_produto || ""}</td>
          <td>R$ ${parseFloat(p.preco_produto).toFixed(2)}</td>
          <td>${p.quantidade_estoque}</td>
          <td>${p.categoria_id || ""}</td>
          <td>${p.ativo ? "Sim" : "Não"}</td>
          <td>
            <button onclick="editarItem(${p.id_produto})">✏️</button>
            <button onclick="excluirItem(${p.id_produto})">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    }
  }
}

// -------- NOVO ITEM --------
function novoItem() {
  abrirFormModal();
  gerarFormFields({});
}

// -------- EDITAR ITEM --------
async function editarItem(id) {
  if (crudAtual === "produtos") {
    try {
      const res = await fetch(`${API_BASE_URL}/produto/${id}`);
      const p = await res.json();
      abrirFormModal();
      gerarFormFields(p);
    } catch (err) {
      console.error("Erro ao buscar produto:", err);
    }
  }
}

// -------- EXCLUIR ITEM --------
async function excluirItem(id) {
  if (!confirm("Deseja excluir este item?")) return;

  if (crudAtual === "produtos") {
    try {
      await fetch(`${API_BASE_URL}/produto/${id}`, { method: "DELETE" });
      carregarItens();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
    }
  }
}

// -------- FORMULÁRIO --------
function abrirFormModal() {
  document.getElementById("formModal").style.display = "block";
  document.getElementById("formOverlay").style.display = "block";
}
function fecharFormModal() {
  document.getElementById("formModal").style.display = "none";
  document.getElementById("formOverlay").style.display = "none";
}

function gerarFormFields(p) {
  document.getElementById("formFields").innerHTML = `
    <input type="hidden" id="id_produto" value="${p.id_produto || ""}">
    <label>Nome:<input type="text" id="nome_produto" value="${p.nome_produto || ""}" required></label>
    <label>Descrição:<textarea id="descricao_produto">${p.descricao_produto || ""}</textarea></label>
    <label>Preço:<input type="number" step="0.01" id="preco_produto" value="${p.preco_produto || ""}" required></label>
    <label>Estoque:<input type="number" id="quantidade_estoque" value="${p.quantidade_estoque || ""}" required></label>
    <label>Imagem URL:<input type="text" id="imagem_produto" value="${p.imagem_produto || ""}"></label>
    <label>Categoria ID:<input type="number" id="categoria_id" value="${p.categoria_id || ""}"></label>
    <label>Ativo:
      <select id="ativo">
        <option value="true" ${p.ativo ? "selected" : ""}>Sim</option>
        <option value="false" ${!p.ativo ? "selected" : ""}>Não</option>
      </select>
    </label>
  `;
  document.getElementById("itemForm").onsubmit = salvarItem;
}

// -------- SALVAR ITEM --------
async function salvarItem(e) {
  e.preventDefault();
  const id = document.getElementById("id_produto").value;

  const produto = {
    nome_produto: document.getElementById("nome_produto").value,
    descricao_produto: document.getElementById("descricao_produto").value,
    preco_produto: parseFloat(document.getElementById("preco_produto").value),
    quantidade_estoque: parseInt(document.getElementById("quantidade_estoque").value),
    imagem_produto: document.getElementById("imagem_produto").value,
    categoria_id: document.getElementById("categoria_id").value || null,
    ativo: document.getElementById("ativo").value === "true"
  };

  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE_URL}/produto/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produto)
      });
    } else {
      res = await fetch(`${API_BASE_URL}/produto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produto)
      });
    }

    if (!res.ok) throw new Error("Erro ao salvar produto");

    fecharFormModal();
    carregarItens();
  } catch (err) {
    console.error("Erro ao salvar produto:", err);
  }
}

// -------- EVENTOS --------
function configurarEventListeners() {
  document.getElementById("btnLogout").addEventListener("click", async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "../loja/index.html";
  });
}
