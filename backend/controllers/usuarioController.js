const express = require("express");
const router = express.Router();

// Listar todos
router.get("/", async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT id_usuario, nome_usuario, email_usuario, cpf_usuario,
              nascimento_usuario, ativo, papel, data_cadastro
         FROM usuarios
         ORDER BY id_usuario`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// Buscar por ID
router.get("/:id", async (req, res) => {
  try {
    const r = await req.db.query(
      `SELECT id_usuario, nome_usuario, email_usuario, cpf_usuario,
              nascimento_usuario, ativo, papel, data_cadastro
         FROM usuarios
        WHERE id_usuario = $1`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

// Criar
router.post("/", async (req, res) => {
  const { nome_usuario, email_usuario, senha_usuario,
          cpf_usuario, nascimento_usuario, ativo, papel } = req.body;
  try {
    const r = await req.db.query(
      `INSERT INTO usuarios
        (nome_usuario,email_usuario,senha_usuario,cpf_usuario,
         nascimento_usuario,ativo,papel,data_cadastro)
       VALUES ($1,$2,crypt($3, gen_salt('bf')),$4,$5,$6,$7,NOW())
       RETURNING id_usuario`,
      [nome_usuario,email_usuario,senha_usuario,cpf_usuario || null,
       nascimento_usuario || null, ativo, papel]
    );
    res.status(201).json({ id_usuario: r.rows[0].id_usuario });
  } catch (err) {
    console.error("Erro ao inserir:", err);
    res.status(500).json({ error: "Erro ao inserir usuário" });
  }
});

// Atualizar
router.put("/:id", async (req, res) => {
  const { nome_usuario, email_usuario, senha_usuario,
          cpf_usuario, nascimento_usuario, ativo, papel } = req.body;
  try {
    let query, params;
    
    if (senha_usuario) {
      query = `UPDATE usuarios SET
         nome_usuario=$1,
         email_usuario=$2,
         cpf_usuario=$3,
         nascimento_usuario=$4,
         ativo=$5,
         papel=$6,
         senha_usuario=crypt($7, gen_salt('bf'))
       WHERE id_usuario=$8
       RETURNING *`;
      params = [nome_usuario, email_usuario, cpf_usuario, nascimento_usuario, ativo, papel, senha_usuario, req.params.id];
    } else {
      query = `UPDATE usuarios SET
         nome_usuario=$1,
         email_usuario=$2,
         cpf_usuario=$3,
         nascimento_usuario=$4,
         ativo=$5,
         papel=$6
       WHERE id_usuario=$7
       RETURNING *`;
      params = [nome_usuario, email_usuario, cpf_usuario, nascimento_usuario, ativo, papel, req.params.id];
    }
    
    const r = await req.db.query(query, params);
    if (!r.rows.length) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar:", err);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
});

// Excluir
router.delete("/:id", async (req, res) => {
  try {
    const r = await req.db.query("DELETE FROM usuarios WHERE id_usuario=$1 RETURNING *",[req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ message: "Usuário excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir:", err);
    res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

module.exports = router;
