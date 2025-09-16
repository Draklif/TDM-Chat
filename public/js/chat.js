const username = localStorage.getItem("username");
if(!username){
    window.location.href = "login.html";
}

// Conectar al servidor WebSocket
let wsUrl;
if (location.hostname === "localhost") {
    wsUrl = "ws://localhost:3000";
} else {
    wsUrl = `wss://${location.host}`; 
}
const socket = new WebSocket(wsUrl);

// Cuando se conecta al WS
socket.addEventListener("open", () => {
    // Avisar al servidor quién soy
    socket.send(JSON.stringify({
        type: "login",
        user: { name: username }
    }));
});

// Cuando llega un mensaje del servidor
socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "chat") {
        addMessage(data.user, data.text);
    }

    if (data.type === "system") {
        addMessageSystem("⚙️", data.text);
    }

    if (data.type === "users") {
        updateUserList(data.users);
    }
});

document.getElementById("chat-username").textContent = "Bienvenido " + username;

const messagesDiv = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.getElementById("userSidebar");
const toggleBtn = document.getElementById("usersToggle");
const closeBtn = document.getElementById("closeSidebar");

function addMessage(user, text){
    const msgEl = document.createElement("div");
    msgEl.classList.add("message");
    if (user === username) {
        msgEl.classList.add("self");
    }
    msgEl.innerHTML = `<strong>${user}: </strong>${text}`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addMessageSystem(user, text){
    const msgEl = document.createElement("div");
    msgEl.classList.add("message");
    if (user === username) {
        msgEl.classList.add("system");
    }
    msgEl.innerHTML = `<strong>${user} ${text}</strong>`;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUserList(users) {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    users.forEach(u => {
        const li = document.createElement("li");
        li.textContent = u;
        userList.appendChild(li);
    });
}

chatForm.addEventListener("submit", function(e){
    e.preventDefault();
    const text = messageInput.value.trim();
    if(text){
        socket.send(JSON.stringify({
            type: "chat",
            user: username,
            text
        }));

        messageInput.value = "";
    }
});

logoutBtn.addEventListener("click", function(){
    localStorage.removeItem("username");
    window.location.href = "login.html";
});

toggleBtn.addEventListener("click", () => {
    sidebar.classList.add("active");
});

closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("active");
});
