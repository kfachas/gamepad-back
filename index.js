const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(formidableMiddleware());
app.use(cors());

app.get("/", (req, res) => {
  try {
    res.status(200).json("welcome !");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const userRoutes = require("./routes/users");
const favoritesRoutes = require("./routes/favorites");
app.use(userRoutes);
app.use(favoritesRoutes);

app.get("*", (req, res) => {
  res.status(400).json({ message: "Page not found !" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started ! 😎");
});
