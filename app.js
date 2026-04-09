//------ Sequelize Setup & frameworks ------
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '/var/www/api/assignmentDatabase.db'
});

//user framework
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

//item framework
const Item = sequelize.define('Item', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastModifiedBy: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

//------- express, sessions, and sockets setup ------

//express setup
const express = require('express');
const session = require('express-session');
const app = express();

//sockets setup
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);

//user connection logging
io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//enable sessions
app.use(session({
    secret: "superSecretKey", /*DELETE BEFORE PUSHING TO GITHUB*/
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { secure: false }
}));

//------ log in/out & auth functions ------

//check user permissions for admin button auth
app.get('/api/me', requireAuth, (req, res) => {
    res.json({
        username: req.session.user.username,
        role: req.session.user.role
    });
});

//login
app.post('/api/login', async (req, res) => { 
	const { username, password } = req.body; 
	const user = await User.findOne({ where: { username } }); 

	if (!user || user.password !== password) { 
		return res.status(401).send("Invalid credentials"); 
	} 

	req.session.user = { 
		username: username, 
		role: user.role 
    }; 
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

//------ item functions ------
// POST, PUT, DELETE require authentication, GET is public. 
// All authenticated actions emit socket events to update all clients in real time.

//GET (unauthenticated)
app.get('/api/items', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        const allItems = await Item.findAll();
        return res.json(allItems);
    }

    const item = await Item.findByPk(parseInt(id));
    if (!item) {
        return res.status(404).json({ error: "Item not found" });
    }

    return res.json(item);
});

//POST (authenticated)
app.post('/api/items', requireAuth, async (req, res) => {
    const { id, name, type } = req.body;
    
    if (!id || !name || !type) {
        return res.status(400).send("Missing parameters");
    }

    const existingItem = await Item.findOne({ where: { id } });
    if (existingItem) {
        return res.status(409).send("Duplicate ID");
    }

    const newItem = await Item.create({ id, name, type, lastModifiedBy: req.session.user.username });

    //emit new item to all clients
    io.emit("newItem", {
        item: newItem,
        user: req.session.user.username
    });


    res.status(201).json({
        message: `Item created by ${req.session.user.username}`,
        item: newItem
    });
});

//PUT (authenticated)
app.put('/api/items/:id', requireAuth, async (req, res) => {
    const item = await Item.findByPk(parseInt(req.params.id));
    
    if (!item) {
        return res.status(404).send("Item not found");
    }

    item.name = req.body.name || item.name;
    item.type = req.body.type || item.type;
    item.lastModifiedBy = req.session.user.username;
    await item.save();

    //emit updated item to all clients
    io.emit("updateItem", {
        item: item,
        user: req.session.user.username
    });
    
    res.send(`Item updated by ${req.session.user.username}`);
});

//DELETE (authenticated)
app.delete('/api/items/:id', requireAuth, async (req, res) => {
    const item = await Item.findByPk(parseInt(req.params.id));
    
    if (!item) {
        return res.status(404).send("Item not found");
    }

    await item.destroy();

    //emit deleted item to all clients
    io.emit("deleteItem", {
        item: item,
        user: req.session.user.username
    });
    
    res.send(`Item deleted by ${req.session.user.username}`);
});


//------ admin user functions ------

//get users
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {

    const users = (await User.findAll({ attributes: ['username', 'role'] }));
    res.json(users);

});

//create user
app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {

    const { username, password, role } = req.body;

    if (!username || !password || !role)
        return res.status(400).send("Missing fields");

    const userExists = await User.findOne({ where: { username } });
    if (userExists)
        return res.status(409).send("User already exists");

    await User.create({ username, password, role });

    res.send(`User ${username} created by ${req.session.user.username}`);

});

//update user
app.put('/api/users/:username', requireAuth, requireAdmin, async (req, res) => {
    const username = req.params.username;
    const { password, role } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user)
        return res.status(404).send("User not found");

    if (password) user.password = password;
    if (role) user.role = role;

    await user.save();

    res.send(`User ${username} updated by ${req.session.user.username}`);
});

//delete user
app.delete('/api/users/:username', requireAuth, requireAdmin, async (req, res) => {
    const username = req.params.username;

    const user = await User.findOne({ where: { username } });
    if (!user)
        return res.status(404).send("User not found");

    await user.destroy();
    res.send(`User ${username} deleted by ${req.session.user.username}`);
});


//------ sync database & run server ------
sequelize.sync({ alter: true }).then(async () => {
    console.log("Database synced");

    //create default users (only once!)
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
        await User.create({ username: 'admin', password: 'admin', role: 'admin' });
    }
    const user1 = await User.findOne({ where: { username: 'user1' } });
    if (!user1) {
        await User.create({ username: 'user1', password: 'password', role: 'author' });
    }
    console.log("Default users created");

    //create default items (only once!)
    const item1 = await Item.findOne({ where: { name: 'miller lite' } });
    if (!item1) {
        await Item.create({ name: 'miller lite', type: 'beer' });
    }
    const item2 = await Item.findOne({ where: { name: 'lost oak' } });
    if (!item2) {
        await Item.create({ name: 'lost oak', type: 'wine' });
    }
    console.log("Default items created");

    server.listen(3000, () => {
        console.log("Server running on port 3000");
    });


}).catch(err => {
    console.error("Error syncing database:", err);
});

