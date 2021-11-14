const mongoose = require("mongoose");

const Reviews = mongoose.model("Reviews", {
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rate: { result: Number, users: Array, like: Number, dislike: Number },
  review_date: { type: Date, default: Date.now },
  game: String,
  title: String,
  text: String,
});

module.exports = Reviews;
