//show users 
async function refreshUserList() {
    try {
        const response = await fetch("/api/users", { credentials: "include" });
        const users = await response.json();
        document.getElementById("usersList").innerText =
            users.map(u => `${u.username} (${u.role})`).join("\n");

    } catch (err) {
        adminMessage.innerText = "Error: " + err.message;
    }
}
refreshUserList();

//create user
const adminMessage = document.getElementById("adminUserMessage");
document.getElementById("createUserForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    try{
        const response = await fetch("/api/users", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: form.username.value,
                password: form.password.value,
                role: form.role.value
            })
        });

        const message = await response.text();
        adminMessage.innerText = message;
        refreshUserList();
        form.reset();

    } catch (err) {
        adminMessage.innerText = "Error: " + err.message;
        return;
    }
});

//update user
document.getElementById("updateUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
        const body = {};
        if (form.password.value) body.password = form.password.value;
        if (form.role.value) body.role = form.role.value;

        const response = await fetch(`/api/users/${form.username.value}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const message = await response.text();
        adminMessage.innerText = message;
        refreshUserList();
        form.reset();

    } catch (err) {
        adminMessage.innerText = "Error: " + err.message;
    }
});

//delete user
document.getElementById("deleteUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
        const response = await fetch(`/api/users/${form.username.value}`, {
            method: "DELETE",
            credentials: "include"
        });

        const message = await response.text();
        adminMessage.innerText = message;
	    refreshUserList();
	    form.reset();

    } catch (err) {
        adminMessage.innerText = "Error: " + err.message;
    }
});
