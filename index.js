const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

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
    // 363c4e78fb2948768916494a0c695e23
    const response = await axios.get(
      `https://api.rawg.io/api/games?key=${process.env.API_KEY}&search=${req.query.search}&page=1`
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// key=363c4e78fb2948768916494a0c695e23
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

app.listen(process.env.PORT || 3001, () => {
  console.log("Server started ! 😎");
});
