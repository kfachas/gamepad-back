const mongoose = require("mongoose");

const Reviews = mongoose.model("Reviews", {
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rate: Number,
  game: String,
  title: String,
  text: String,
});

module.exports = Reviews;
