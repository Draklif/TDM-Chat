const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

// Helpers
function getUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function handleUsersRoutes(req, res) {
    // POST /api/login
    if (req.url === "/api/login" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => (body += chunk));
        req.on("end", () => {
            try {
                const { name, password } = JSON.parse(body);
                const users = getUsers();
                const user = users.find(u => u.name === name && u.password === password);
                if (!user) {
                    res.writeHead(401);
                    res.end(JSON.stringify({ error: "Credenciales inválidas" }));
                    return;
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    message: "Login exitoso",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        rol: user.rol,
                        img: user.img
                    }   
                }));
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "JSON inválido" }));
            }
        });
        return true;
    }

    if (req.url.startsWith("/api/users")) {
        const method = req.method;
        const parts = req.url.split("/").filter(Boolean);
        const id = parts[2] ? parseInt(parts[2]) : null;

        // GET /api/users
        if (method === "GET" && parts.length === 2) {
            const users = getUsers();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(users));
            return true;
        }

        // GET /api/users/:id
        if (method === "GET" && parts.length === 3 && id) {
            const users = getUsers();
            const user = users.find(u => u.id === id);
            if (!user) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Usuario no encontrado" }));
                return true;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(user));
            return true;
        }

        // POST /api/users (crear usuario)
        if (method === "POST" && parts.length === 2) {
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => {
                try {
                    const { name, password, email, rol, img } = JSON.parse(body);
                    if (!name || !password || !email) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
                        return;
                    }
                    const users = getUsers();
                    const newUser = {
                        id: users.length ? users[users.length - 1].id + 1 : 1,
                        name,
                        password,
                        email,
                        rol: rol || "user",
                        img: img || "https://i.pravatar.cc/150"
                    };
                    users.push(newUser);
                    saveUsers(users);
                    res.writeHead(201, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(newUser));
                } catch (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "JSON inválido" }));
                }
            });
            return true;
        }

        // PUT /api/users/:id (actualizar usuario)
        if (method === "PUT" && parts.length === 3 && id) {
            let body = "";
            req.on("data", chunk => (body += chunk));
            req.on("end", () => {
                try {
                    const update = JSON.parse(body);
                    const users = getUsers();
                    const index = users.findIndex(u => u.id === id);
                    if (index === -1) {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: "Usuario no encontrado" }));
                        return;
                    }
                    users[index] = { ...users[index], ...update, id };
                    saveUsers(users);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(users[index]));
                } catch (err) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "JSON inválido" }));
                }
            });
            return true;
        }

        // DELETE /api/users/:id
        if (method === "DELETE" && parts.length === 3 && id) {
        const users = getUsers();
        const newUsers = users.filter(u => u.id !== id);
        if (newUsers.length === users.length) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Usuario no encontrado" }));
            return true;
        }
        saveUsers(newUsers);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Usuario eliminado" }));
        return true;
        }
    }

    return false;
}

module.exports = handleUsersRoutes;
