const express = require("express");
const router = express.Router();

const isAuthenticated = require("../middleware/isAuthenticated");
const User = require("../models/User");
const Reviews = require("../models/Reviews");

router.post("/game/reviews", async (req, res) => {
  try {
    const reviews = await Reviews.find({ game: req.fields.gameId }).populate({
      path: "owner",
      select: "account",
    });

    const result = [];
    for (let i = 0; i < reviews.length; i++) {
      for (let j = 0; j < reviews.length; j++) {
        if (reviews[i].rate.result > reviews[j].rate.result) {
          if (j === reviews.length - 1) {
            result.unshift(reviews[i]);
          }
        } else if (j === reviews.length - 1) {
          result.push(reviews[i]);
        }
      }
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/game/reviewRating", isAuthenticated, async (req, res) => {
  try {
    const review = await Reviews.findById(req.fields.id);
    for (let i = 0; i < review.rate.users.length; i++) {
      if (review.rate.users[i] === req.user) {
        return res
          .status(400)
          .json({ message: "Vous ne pouvez voté qu'une fois" });
      }
    }

    if (req.fields.rate) {
      review.rate.result += req.fields.rate;
      review.rate.users.push(req.user);
      review.markModified("rate.rating");
    }

    await review.save();
    res.status(200).json(review.rate);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.post("/game/addReview", isAuthenticated, async (req, res) => {
  try {
    const searchReview = await Reviews.findOne({
      game: req.fields.game,
      owner: req.user,
    });
    if (!searchReview) {
      const newReview = new Reviews({
        owner: req.user,
        title: req.fields.title,
        rate: {
          result: 0,
          rating: [{ id: req.user, value: 0 }],
        },
        text: req.fields.text,
        game: req.fields.game,
      });
      await newReview.save();
    } else {
      return res
        .status(401)
        .json({ message: "U already add a review for this game" });
    }
    res.status(200).json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
