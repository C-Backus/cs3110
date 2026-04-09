async function socketCalls(){
    username = null;

    //get username
    try {

        const response = await fetch("/api/me", {
            credentials: "include"
        });

        if (!response.ok) {
            username = null;
            return;
        }

        const user = await response.json();
        username = user.username;

        username = user.username;
    } catch (err) {
        console.log("User check failed:", err);
    }

    //socket calls. Alerts user of changes made by other users, but not their own changes.
    const socket = io();
    socket.on("newItem", (data) => {
        const message = `New item added: ${data.item.name} (${data.item.type}) by ${data.user}`;

        console.log(data.user, username);
        
        if (data.user === username) {
            return; 
        }
        else{
            alert(message);
        }
        showObject();
    });

    socket.on("updateItem", (data) => {
        const message = `Item updated: ${data.item.name} (${data.item.type}) by ${data.user}`;

        console.log("data user:", data.user, "username:", username);

        if (data.user === username) {
            return; 
        }
        else{
            alert(message);
        }
        showObject();
    });

    socket.on("deleteItem", (data) => {
        const message = `Item deleted: ${data.item.name} (${data.item.type}) by ${data.user}`;

        console.log(data.user, username);

        if (data.user === username) {
            return; 
        }
        else{
            alert(message);
        }
        showObject();
    });
}
socketCalls();

const getObject = document.getElementById("getObject");
const getResult = document.getElementById("getResult");
const postResult = document.getElementById("postResult");

//Show all items
async function showObject() {
    const object = await fetch("/api/items");
    const items = await object.json();

    let text = "";
    for (let i = 0; i < items.length; i++) {

        if (items[i].lastModifiedBy === null) {
            text += items[i].id + ": " + items[i].name + " (" + items[i].type + ") - Default item " + "\n";
        } else {
            text += items[i].id + ": " + items[i].name + " (" + items[i].type + ") - Last modified by: " + items[i].lastModifiedBy + "\n";
        }
    }
    getObject.innerText = text;
}

//check user type to show admin panel button
async function checkAdminButton() {

    const adminButton = document.getElementById("adminButton");
    if (!adminButton) return;

    try {

        const response = await fetch("/api/me", {
            credentials: "include"
        });

        if (!response.ok) {
            adminButton.style.display = "none";
            return;
        }

        const user = await response.json();

        if (user.role === "admin") {
            adminButton.style.display = "inline-block";
        }

    } catch (err) {
        console.log("Admin check failed:", err);
    }

}
checkAdminButton();

//log in
const loginMessage = document.getElementById("loginMessage");
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include"
        });

        if (!response.ok) {
            loginMessage.innerText = "Login failed";
            return;
        }

        loginMessage.innerText = "Welcome " + username;
	checkAdminButton();
	loginForm.reset();
    } catch (err) {
        loginMessage.innerText = "Login error: " + err.message;
    }
});

//logout button
document.getElementById("logoutButton").addEventListener("click", async function() {
    try {
        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            checkAdminButton();
	        loginMessage.innerText = "Logged out successfully";
            document.getElementById("getResult").innerText = "";
            document.getElementById("postResult").innerText = "";
            showObject();
	    
        } else {
            loginMessage.innerText = "Logout failed";
        }
    } catch (err) {
        loginMessage.innerText = "Logout error: " + err.message;
    }
});

//GET
document.getElementById("getForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const id = event.target.id.value;
    let url = "/api/items";
    if (id) url += "?id=" + id;
    const response = await fetch(url);
    if (!response.ok) {
        getResult.innerText = "Error " + response.status;
        return;
    }

    const item = await response.json();
    if (Array.isArray(item)) {
        let text = "";
        for (let i = 0; i < item.length; i++) {
            text += item[i].id + ": " + item[i].name + " (" + item[i].type + ")\n";
        }
        getResult.innerText = text;
    } else {
        getResult.innerText = item.id + ": " + item.name + " (" + item.type + ")";
    }
});


//POST
document.getElementById("postForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const form = event.target;

    // ensure user is logged in
    const check = await fetch("/api/items", { method: "GET", credentials: "include" });
    if (check.status === 401) {
        await login();
    }

    const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: Number(form.id.value),
            name: form.name.value,
            type: form.type.value
        }),
        credentials: "include"
    });

    const message = await response.json();
    postResult.innerText = message.message;
    form.reset();
    showObject();
});

//PUT
document.getElementById("putForm")?.addEventListener("submit", async function(event) {
event.preventDefault();
const form = event.target;
const id = Number(form.id.value);

const response = await fetch(`/api/items/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        name: form.name.value,
        type: form.type.value
    })
});

const message = await response.text();
postResult.innerText = message;
form.reset();
showObject();

});

//DELETE
document.getElementById("deleteForm")?.addEventListener("submit", async function(event) {
event.preventDefault();
const form = event.target;
const id = Number(form.id.value);

const response = await fetch(`/api/items/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
        "Content-Type": "application/json"
    }
});

const message = await response.text();
postResult.innerText = message;
form.reset();
showObject();

});

showObject();
