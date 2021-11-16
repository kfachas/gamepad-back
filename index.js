const schedule = require("node-schedule");

const express = require("express");
const formidableMiddleware = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
// const moment = require("mome")
const moment = require("moment-timezone");
const io = require("socket.io")(8900, {
  cors: { origin: "http://localhost:3001" },
});
require("dotenv").config();
// process.env.PORT ||
const port = 3310;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let mongooseData = mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const Message = require("./models/Message");

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

  const listMessagesData = await Message.find();

  socket.on("getMessages", (getMessages) => {
    getMessages && io.emit("listMessages", listMessagesData);
  });

  // socket.on("addUser", (userId) => {
  //   // addUser(userId, socket.id);

  //   console.log("adduser", userId);
  // });

  socket.on("newMessage", async (message) => {
    const newMessage = new Message({
      senderId: message.senderId,
      text: message.text,
      name: message.name,
      createdDate: message.createdDate,
    });

    await newMessage.save();
    console.log("newMessage");
    io.emit("newMessage", newMessage);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.second = 0;
rule.minute = 0;

// for global timezone
// rule.tz = "Etc/UTC";
rule.ts = "Europe/Paris";

const oldMessagesToDelete = () =>
  schedule.scheduleJob(rule, async () => {
    const dayBeforeYesterday = moment()
      .subtract("2", "days")
      .startOf("day")
      .toDate();

    const messages = await Message.find({
      createdDate: { $lte: dayBeforeYesterday },
    });
    console.log("messagesToDelete", messages);
    if (messages.length > 0) {
      const promises = [];
      messages.forEach((message) => {
        const promise = Message.findByIdAndDelete(message._id);
        promises.push(promise);
      });

      await Promise.all(promises);
      console.log("delete all old messages successfully");
    } else {
      console.log("nothing to delete");
    }
    // delete the collection
    // await mongoose.connection.collection("messages").drop();
    // console.log(messages);
  });

app.listen(port, () => {
  console.log("Server start");
  console.log("Press CTRL-C to stop\n");
  oldMessagesToDelete();
  app.on("close", () => {
    app.removeAllListeners();
  });
});
