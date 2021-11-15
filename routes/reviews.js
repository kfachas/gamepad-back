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

    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/game/updateReview", isAuthenticated, async (req, res) => {
  try {
    const reviewToUpdate = await Reviews.findById(req.fields.id);
    if (req.fields.newText || req.fields.newTitle) {
      reviewToUpdate.title = req.fields.newTitle
        ? req.fields.newTitle
        : reviewToUpdate.title;
      reviewToUpdate.text = req.fields.newText
        ? req.fields.newText
        : reviewToUpdate.text;
    }
    await reviewToUpdate.save();

    return res.status(200).json(reviewToUpdate);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

router.post("/game/deleteReview", isAuthenticated, async (req, res) => {
  try {
    const reviewToDelete = await Reviews.findByIdAndRemove(req.fields.id);
    if (reviewToDelete) {
      return res.status(200).json("success");
    } else {
      return res.status(400).json({ message: "Review already delete" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
});

router.post("/game/reviewRating", isAuthenticated, async (req, res) => {
  try {
    const review = await Reviews.findById(req.fields.id).populate({
      path: "owner",
      select: "account",
    });
    const findUserRateIndex = review.rate.users.findIndex(
      (user) => user.id === req.uid
    );
    if (req.fields.userRate) {
      // if user didnt already rate this review
      if (findUserRateIndex === -1) {
        review.rate[req.fields.userRate] += 1;

        review.rate.users.push({
          id: req.uid,
          rate: req.fields.userRate,
        });
        review.rate.result += 1;
      } else {
        // if rate is different than the previous rate
        if (req.fields.userRate !== review.rate.users[findUserRateIndex].rate) {
          if (req.fields.userRate === "like") {
            review.rate.like += 1;
            review.rate.dislike -= 1;
          } else if (req.fields.userRate === "dislike") {
            review.rate.dislike += 1;
            review.rate.like -= 1;
          }
          review.rate.users[findUserRateIndex].rate = req.fields.userRate;
          //  if the vote is the same as the previous one then it means that the user removes his vote
        } else if (
          req.fields.userRate === review.rate.users[findUserRateIndex].rate
        ) {
          review.rate[req.fields.userRate] -= 1;
          if (review.rate.result > 0) {
            review.rate.result -= 1;
          }

          // remove user in the review.rate.users Array
          const updateReview = [...review.rate.users];
          updateReview.splice(findUserRateIndex, 1);
          review.rate.users = updateReview;
        }
      }

      review.markModified("rate.users");

      await review.save();
    } else {
      return res.status(400).json("Probleme");
    }

    return res.status(200).json(review);
  } catch (error) {
    console.log(error.message);
    return res.status(400).json(error.message);
  }
});

router.post("/game/addReview", isAuthenticated, async (req, res) => {
  try {
    const searchReview = await Reviews.findOne({
      game: req.fields.game,
      owner: req.uid,
    });
    if (!searchReview) {
      const newReview = new Reviews({
        owner: req.uid,
        title: req.fields.title,
        rate: {
          result: 0,
          users: [],
          like: 0,
          dislike: 0,
        },
        text: req.fields.text,
        game: req.fields.game,
      });
      await newReview.save();
      return res.status(200).json(req.uid);
    } else {
      return res
        .status(401)
        .json({ message: "You already add a review for this game" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
