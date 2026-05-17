const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const recommendationRoutes = require('./routes/recommendationRoutes.js');

const authRoutes =
  require("./routes/authRoutes");

const userAuthRoutes =
  require("./routes/userAuthRoutes");

const wishlistRoutes =
  require("./routes/wishlistRoutes");

const connectDB =
  require("./config/db");

const productRoutes =
  require("./routes/productRoutes");

dotenv.config();


// CONNECT DATABASE
connectDB();


// CREATE EXPRESS APP
const app = express();


// MIDDLEWARE
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:4200",
  "http://localhost:5001",
  process.env.RENDER_EXTERNAL_URL,
  ...configuredOrigins
].filter(Boolean));

app.use(cors({

  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    'PATCH'
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ]

}));

app.use(express.json());


// ROUTES
app.use("/api/auth", authRoutes);

app.use("/api/users", userAuthRoutes);

app.use("/api/products", productRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use('/api/recommendations', recommendationRoutes);


// HEALTH CHECK
app.get("/api/health", (req, res) => {

  res.json({ status: "ok" });

});

app.use("/api", (req, res) => {

  res.status(404).json({ message: "API route not found" });

});

const clientDistPath =
  path.join(__dirname, "../../client/dist/frontend-app/browser");

if (fs.existsSync(clientDistPath)) {

  app.use(express.static(clientDistPath));

  app.get("*", (req, res) => {

    res.sendFile(path.join(clientDistPath, "index.html"));

  });

} else {

  app.get("/", (req, res) => {

    res.send("API Running");

  });

}


// PORT
const PORT =
  process.env.PORT || 5001;


// START SERVER
app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
