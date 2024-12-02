const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
    const error = request.query.error || null;
    response.render("login", { error });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const {email, password} = request.body;
    const user = USERS.find((user) => user.email === email);

    if (!!user && bcrypt.compareSync(password, user.password)) {
        request.session.username = user.username;
        request.session.role = user.role;
        request.session.email = user.email;
        return response.redirect("/landing");
    }

    // Error message:
    return response.status(400).render("login", { 
        error: "ERROR: Invalid or Incorrect Email or Password." 
    });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    const error = request.query.error || null;
    response.render("signup", { error });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const username = request.body.username;
    const email = request.body.email;
    const newPassword = request.body.password;
    const newID = Math.max(...USERS.map(user => user.id)) + 1;
    const newUser = {
        id: newID,
        username: username,
        email: email,
        password: bcrypt.hashSync(newPassword, SALT_ROUNDS),
        role: "user"
    }

    // Error messages:
    if (USERS.find((user) => user.username === username)) {
        return response.status(400).render("signup", {
            error: "ERROR: Username has already been registered.",
        });
    } else if (USERS.find((user) => user.email === email)) {
        return response.status(400).render("signup", {
            error: "ERROR: Email has already been registered.",
        });
    }


    USERS.push(newUser)
    console.log(USERS)
    console.log("success");
    response.redirect("/");
});

// POST /logout - Allows a user to logout
app.post("/logout", (request, response) => {
    request.session.destroy();
    response.redirect("/");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    const username = request.session.username;
    const role = request.session.role;

    // For admins
    if (role === "admin") {
        return response.render("landing", {username, users: USERS});
    }

    // For users
    return response.render("landing", { username, users: null });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
