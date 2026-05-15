const express = require("express");
const path = require("path");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        name: "cyberpoint.sid",
        secret: process.env.SESSION_SECRET || "cyberpoint-super-secure-session-key",
        resave: true,
        saveUninitialized: true,
        rolling: true,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

app.use((err, req, res, next) => {
    console.log("SERVER ERROR:");
    console.log(err);

    res.status(500).send(`
        <h1 style="font-family:Arial;padding:30px">Internal Server Error</h1>
        <pre style="padding:30px;color:red">${err.stack}</pre>
    `);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});