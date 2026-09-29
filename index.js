require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir llamadas desde React (Vercel)

// Pool de conexión con soporte SSL para Aiven
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false }, // Permite la conexión cifrada requerida por Aiven
  waitForConnections: true,
  connectionLimit: 10
});

// GET /ventas (Usando clientes_id)
app.get('/ventas', (req, res) => {
  const sql = `SELECT v.id, c.nombre AS cliente, p.nombre AS producto,
  v.cantidad, DATE_FORMAT(v.fecha, '%Y-%m-%d') AS fecha, p.precio, (v.cantidad * p.precio) AS total,
  v.clientes_id, v.producto_id
  FROM ventas v
  INNER JOIN clientes c ON v.clientes_id = c.id
  INNER JOIN productos p ON v.producto_id = p.id`;

  conexion.query(sql, (err, resultados) => {
    if (err) {
      console.error("Error SQL:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(resultados);
  });
});

// GET /clientes y GET /productos
app.get('/clientes', (req, res) => {
  conexion.query('SELECT * FROM clientes', (err, r) => err ? res.status(500).json(err) : res.json(r));
});

app.get('/productos', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, r) => err ? res.status(500).json(err) : res.json(r));
});

// POST /ventas (Usando clientes_id)
app.post('/ventas', (req, res) => {
  const { clientes_id, producto_id, cantidad, fecha } = req.body;
  conexion.query(
    'INSERT INTO ventas (clientes_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [clientes_id, producto_id, cantidad, fecha],
    (err) => err ? res.status(500).json(err) : res.send({ message: 'Venta registrada correctamente' })
  );
});

// PUT /ventas/:id (Usando clientes_id)
app.put('/ventas/:id', (req, res) => {
  const id = req.params.id;
  const { clientes_id, producto_id, cantidad, fecha } = req.body;
  conexion.query(
    'UPDATE ventas SET clientes_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?',
    [clientes_id, producto_id, cantidad, fecha, id],
    (err) => err ? res.status(500).json(err) : res.send({ message: `Venta con ID ${id} actualizada` })
  );
});

// DELETE /ventas/:id
app.delete('/ventas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM ventas WHERE id=?', [id], (err) =>
    err ? res.status(500).json(err) : res.send({ message: `Venta con ID ${id} eliminada` })
  );
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
});