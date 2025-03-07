require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const axios = require("axios"); // Importa axios para realizar la solicitud de IP

const app = express();
const port = process.env.PORT || 8080; // ✅ Puerto correcto

// Verifica que las variables de entorno se carguen correctamente
console.log("🔹 DB_HOST:", process.env.DB_HOST);
console.log("🔹 DB_USER:", process.env.DB_USER);
console.log("🔹 DB_PASS:", process.env.DB_PASS);
console.log("🔹 DB_NAME:", process.env.DB_NAME);
console.log("🔹 DB_PORT:", process.env.DB_PORT);

require("dotenv").config({ path: __dirname + "/.env" });

// 📌 Configurar la base de datos correctamente
const db = mysql.createConnection({
    host: process.env.DB_HOST || "mysql.railway.internal", // ✅ Asegurar el host de Railway
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error("❌ Error conectando a MySQL:", err);
        return;
    }
    console.log("✅ Conectado a MySQL");
});

// 📌 Middleware para recibir JSON
app.use(express.json());

// 📌 Endpoint para recibir datos del GPS
app.post("/gps", (req, res) => {
    const { id, latitud, longitud, velocidad, id_dispositivo } = req.body;

    if (!id || !latitud || !longitud || !id_dispositivo) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    // Aquí incluimos el campo 'id' en la inserción
    const sql = "INSERT INTO ubicaciones (id, id_dispositivo, latitud, longitud, velocidad, fecha) VALUES (?, ?, ?, ?, ?, NOW())";
    db.query(sql, [id, id_dispositivo, latitud, longitud, velocidad], (err, result) => {
        if (err) {
            console.error("❌ Error al insertar datos:", err);
            return res.status(500).json({ error: "Error al guardar la ubicación", details: err.message });
        }
        res.json({ success: true, message: "Ubicación guardada" });
    });
});

// 📌 Endpoint para consultar la última ubicación
app.get("/gps/:id_dispositivo", (req, res) => {
    const { id_dispositivo } = req.params;
    const sql = "SELECT * FROM ubicaciones WHERE id_dispositivo = ? ORDER BY fecha DESC LIMIT 1";
    
    db.query(sql, [id_dispositivo], (err, result) => {
        if (err) {
            console.error("❌ Error al consultar datos:", err);
            return res.status(500).json({ error: "Error al obtener los datos" });
        }
        res.json(result[0] || { message: "No hay datos" });
    });
});

// 📌 Endpoint para obtener la IP pública del servidor
app.get("/ip", async (req, res) => {
    try {
        const response = await axios.get("https://api.ipify.org?format=json");
        const ip = response.data.ip;
        res.json({ ip: ip });
    } catch (error) {
        console.error("❌ Error al obtener la IP:", error);
        res.status(500).json({ error: "No se pudo obtener la IP" });
    }
});

app.get("/", (req, res) => {
    res.send("🚀 Servidor funcionando correctamente en Railway");
});

// 📌 Iniciar el servidor
app.listen(port, () => {
    console.log(`✅ Servidor corriendo en el puerto ${port}`);
});

console.log(app._router.stack.map(r => r.route?.path).filter(Boolean));

setInterval(() => {
    console.log("✅ Keep-Alive: Servidor sigue activo");
}, 60000); // Cada 60 segundos
