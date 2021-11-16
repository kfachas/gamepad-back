const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      unique: true,
      type: String,
    },
    avatar: Object,
  },
  top: {
    1: Object,
    2: Object,
    3: Object,
  },
  gamesFav: [],
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
