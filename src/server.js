const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const handleUsersRoutes = require("./routes/users");

const PORT = 3000;
const PUBLIC_PATH = path.join(__dirname, "..", "public");

const server = http.createServer((req, res) => {
    // Imprimir peticiones
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Rutas API
    if (handleUsersRoutes(req, res)) return;

    // Archivos estáticos
    let filePath = req.url === "/" ? "login.html" : req.url;
    const extname = path.extname(filePath);
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpg",
        ".gif": "image/gif"
    };

    const fullPath = path.join(PUBLIC_PATH, filePath);

    let contentType = mimeTypes[extname] || "text/plain";

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404);
                res.end("404 Not Found");
            } else {
                res.writeHead(500);
                res.end(`Error del servidor: ${err.code}`);
            }
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
});

const wss = new WebSocket.Server({ server });

let users = [];

function broadcast(data) {
    const msg = JSON.stringify(data);
    users.forEach(u => u.ws.send(msg));
}

wss.on("connection", (ws, req) => {
    let currentUser = null;

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

    ws.on("message", (msg) => {
        console.log(`${new Date().toISOString()} - 📩 Mensaje recibido:`, msg.toString());

        const data = JSON.parse(msg);

        if (data.type === "login") {
            currentUser = { name: data.user.name, ws };

            console.log(`${new Date().toISOString()} - 🟢 Cliente conectado (${currentUser.name} | ${ip})`);

            users.push(currentUser);

            broadcast({ type: "system", text: `${currentUser.name} se unió` });

            broadcast({ 
                type: "users", 
                users: users.map(u => u.name) 
            });
        }

        if (data.type === "chat") {
            broadcast({ type: "chat", user: data.user, text: data.text });
        }
    });

    ws.on("close", () => {
        if (currentUser) {
            console.log(`${new Date().toISOString()} - 🔴 Cliente desconectado (${currentUser.name} | ${ip})`);
            users = users.filter(u => u !== currentUser);
            broadcast({ type: "system", text: `${currentUser.name} salió` });

            // Enviar lista actualizada
            broadcast({ 
                type: "users", 
                users: users.map(u => u.name) 
            });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});