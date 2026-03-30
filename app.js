const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//session middleware
app.use(session({
    secret: "superSecretKey", //should be stronger
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { secure: false }
}));

//items
let items = [
    { id: 1, name: "miller lite", type: "beer" },
    { id: 2, name: "lost oak", type: "wine" }
];

//users
const users = {
    admin: { password: "admin", role: "admin" },
    user1: { password: "password", role: "author" }
};

//check user permissions for admin button auth
app.get('/api/me', requireAuth, (req, res) => {
    res.json({
        username: req.session.user.username,
        role: req.session.user.role
    });
});

//login
app.post('/api/login', (req, res) => { 
	const { username, password } = req.body; 
	const user = users[username]; 

	if (!user || user.password !== password) { 
		return res.status(401).send("Invalid credentials"); 
	} 

	req.session.user = { 
		username: username, 
		role: user.role }; 
	res.send("Login successful"); 
});

//logout
app.post('/api/logout', (req, res) => {

    req.session.destroy(() => {
        res.send("Logged out");
    });

});

//regular auth
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).send("Not logged in");
    }
    next();
}

//admin auth
function requireAdmin(req, res, next) {

    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Admin access required");
    }

    next();
}

//GET (unauthenticated)
app.get('/api/items', (req, res) => {
    const { id } = req.query;
    if (!id) return res.json(items);

    const numericId = parseInt(id);
    if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID" });

    const item = items.find(i => i.id === numericId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    return res.json(item);
});

//POST (authenticated)
app.post('/api/items', requireAuth, (req, res) => {
    const { id, name, type } = req.body;
    if (!id || !name || !type) return res.status(400).send("Missing parameters");
    if (items.find(i => i.id === parseInt(id))) return res.status(409).send("Duplicate ID");

    items.push({ id: parseInt(id), name, type });
    res.send(`Item added successfully by ${req.session.user.username}`);
});

//PUT (authenticated)
app.put('/api/items/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const item = items.find(i => i.id === id);
    if (!item) return res.status(404).send("Item not found");

    item.name = req.body.name || item.name;
    item.type = req.body.type || item.type;
    res.send(`Item updated by ${req.session.user.username}`);
});

//DELETE (authenticated)
app.delete('/api/items/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).send("Item not found");

    items.splice(index, 1);
    res.send(`Item deleted by ${req.session.user.username}`);
});

app.get('/api/users', requireAuth, requireAdmin, (req, res) => {

    const safeUsers = Object.entries(users).map(([username, info]) => ({
        username,
        role: info.role
    }));

    res.json(safeUsers);

});


//admin user functions
app.post('/api/users', requireAuth, requireAdmin, (req, res) => {

    const { username, password, role } = req.body;

    if (!username || !password || !role)
        return res.status(400).send("Missing fields");

    if (users[username])
        return res.status(409).send("User already exists");

    users[username] = { password, role };

    res.send(`User ${username} created by ${req.session.user.username}`);

});

//update user
app.put('/api/users/:username', requireAuth, requireAdmin, (req, res) => {
    const username = req.params.username;
    const { password, role } = req.body;

    if (!users[username])
        return res.status(404).send("User not found");

    if (password) users[username].password = password;
    if (role) users[username].role = role;

    res.send(`User ${username} updated by ${req.session.user.username}`);
});

//delete user
app.delete('/api/users/:username', requireAuth, requireAdmin, (req, res) => {
    const username = req.params.username;

    if (!users[username])
        return res.status(404).send("User not found");

    delete users[username];
    res.send(`User ${username} deleted by ${req.session.user.username}`);
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});
