require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");

const app = express();
const port = process.env.PORT || 3000;

// Configurar la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL");
});

// Endpoint para recibir datos del GPS
app.use(express.json());
app.post("/gps", (req, res) => {
    const { latitud, longitud, velocidad, id_dispositivo } = req.body;

    if (!latitud || !longitud || !id_dispositivo) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const sql = "INSERT INTO ubicaciones (id_dispositivo, latitud, longitud, velocidad, fecha) VALUES (?, ?, ?, ?, NOW())";
    db.query(sql, [id_dispositivo, latitud, longitud, velocidad], (err, result) => {
        if (err) throw err;
        res.json({ success: true, message: "Ubicación guardada" });
    });
});

// Endpoint para consultar ubicaciones
app.get("/gps/:id_dispositivo", (req, res) => {
    const { id_dispositivo } = req.params;
    const sql = "SELECT * FROM ubicaciones WHERE id_dispositivo = ? ORDER BY fecha DESC LIMIT 1";
    db.query(sql, [id_dispositivo], (err, result) => {
        if (err) throw err;
        res.json(result[0] || { message: "No hay datos" });
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
