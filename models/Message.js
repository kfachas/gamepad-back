const mongoose = require("mongoose");

const Message = mongoose.model("Message", {
  senderId: String,
  createdDate: { type: Date, default: Date.now },
  name: String,
  text: String,
});

module.exports = Message;
