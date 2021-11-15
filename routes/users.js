const express = require("express");
const router = express.Router();
// For authentification :
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const isAuthenticated = require("../middleware/isAuthenticated");

const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

// Road for inscription
router.post("/user/signup", async (req, res) => {
  try {
    // search if email already exist in DB
    const user = await User.findOne({ email: req.fields.email });

    // if she already exist then return error message
    if (user) {
      res.status(409).json({ message: "This email already has an account" });

      // Else if the user filled all required elements :
    } else {
      if (req.fields.email && req.fields.password && req.fields.username) {
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);

        // Create his account
        const newUser = new User({
          email: req.fields.email,
          token: token,
          hash: hash,
          salt: salt,
          account: {
            username: req.fields.username,
          },
          gamesFav: [],
        });

        if (req.files.picture) {
          // Send picture at cloudinary if she exist
          const result = await cloudinary.uploader.upload(
            req.files.picture.path,
            {
              folder: `/gamepad/profils/${newUser._id}`,
            }
          );
          // Add picture in newUser
          newUser.account.avatar = result.secure_url;
        }
        // Save his account in DB
        await newUser.save();

        res.status(200).json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        // Else if the user forgot to filled some parametres required :
        res.status(400).json({ message: "Missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Road for login
router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.fields.email,
    });

    if (user) {
      if (
        //  test if password input is the same of the hash in DataBase
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

// Road for list favorites games user
router.post("/user/findGameFav", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.uid);
    console.log("la");
    let findGame;

    console.log(user);
    if (user.gamesFav.length > 0) {
      findGame = user.gamesFav.some((game) => game.id === req.fields.gameId);
      console.log(findGame);
    }
    console.log("la");
    if (findGame && user.gamesFav.length > 0) {
      return res.status(200).json({ isAlreadyInFav: findGame });
    } else {
      return res.status(200).json({ isAlreadyInFav: findGame });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

router.post("/user/gamesFav", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.uid);

    return res.status(200).json(user.gamesFav);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/updateFavorites", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.uid);
    const actionArray = ["save", "remove"];
    if (actionArray.includes(req.fields.action)) {
      if (req.fields.action === "save") {
        if (
          user.gamesFav.length > 0 &&
          user.gamesFav.find((game) => game.id === req.fields.game.id)
        ) {
          return res.status(400).json({ message: "Already put in favorites" });
        }
        user.gamesFav.push(req.fields.game);
      }

      if (req.fields.action === "remove") {
        const findIndexGame = user.gamesFav.findIndex(
          (game) => game.id === req.fields.game.id
        );

        if (findIndexGame !== -1) {
          console.log("la");
          user.gamesFav.splice(findIndexGame, 1);
        }
      }

      user.markModified("gamesFav");

      await user.save();

      return res.json({ message: "success" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
