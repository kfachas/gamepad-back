const express = require("express");
const router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated");
const User = require("../models/User");
const Reviews = require("../models/Reviews");

router.post("/game/reviews", async (req, res) => {
  try {
    const reviews = await Reviews.find({ game: req.fields.gameId }).populate(
      "owner"
    );
    res.status(200).json(reviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/game/reviewRating", isAuthenticated, async (req, res) => {
  try {
    const review = await Reviews.findById(req.fields.id);

    if (req.fields.rate === 1) {
      review.rate += req.fields.rate;
    } else {
      review.rate -= req.fields.rate;
    }

    await review.save();
    res.status(200).json(review.rate);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/game/addReview", isAuthenticated, async (req, res) => {
  try {
    const newReview = new Reviews({
      owner: req.user,
      title: req.fields.title,
      rate: 0,
      text: req.fields.text,
      game: req.fields.game,
    });

    await newReview.save();
    res.status(200).json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
