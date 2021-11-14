const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const io = require("socket.io")(8900, {
  cors: { origin: "http://localhost:3000" },
});
require("dotenv").config();
// process.env.PORT ||
const port = 3310;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const app = express();
app.use(formidableMiddleware());
app.use(cors());

app.get("/", async (req, res) => {
  try {
    let queries = "";
    if (req.query.platforms && req.query.platforms !== "") {
      queries = queries + `&platforms=${req.query.platforms}`;
    }
    if (req.query.tags && req.query.tags !== "") {
      if (queries) {
        queries = queries + `&tags=${req.query.tags}`;
      } else {
        queries = queries + `&tags=${req.query.tags}`;
      }
    }

    const response = await axios.get(
      `https://api.rawg.io/api/games?key=${process.env.API_KEY}&search=${req.query.search}&page=${req.query.page}&ordering=${req.query.ordering}&search_precise=true` +
        queries
    );

    return res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/tags", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.rawg.io/api/tags?key=${process.env.API_KEY}`
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/platforms", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.rawg.io/api/platforms?key=${process.env.API_KEY}`
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/games/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.rawg.io/api/games/${req.params.id}?key=${process.env.API_KEY}`
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const userRoutes = require("./routes/users");
const reviewRoute = require("./routes/reviews");
app.use(userRoutes);
app.use(reviewRoute);

app.get("*", (req, res) => {
  res.status(400).json({ message: "Page not found !" });
});

io.on("connection", async (socket) => {
  console.log("New user connected");

  io.emit("welcome", "this is socket server");
  socket.on("addUser", (userId) => {
    // addUser(userId, socket.id);

    console.log("adduser", userId);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.listen(port, () => console.log("Server start"));
