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
    const user = await User.findById(req.user);
    
      let findGame = user.gamesFav.find((game) => game.id === req.fields.gameId)
      if (findGame) {
        return res.status(200).json({isAlreadyInFav: true});
      } else {
        return res.status(400).json({ message: "Already put in favorites" });
      }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.post("/user/gamesFav", isAuthenticated, async (req, res) => {
  try {
    
    const user = await User.findById(req.user);

    return res.status(200).json(user.gamesFav);
    
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Road for add an favorite
router.post("/user/addFavorites", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user) {
      for (let i = 0; i < user.gamesFav.length; i++) {
        if (user.gamesFav[i].id === req.fields.game.id) {
          return res.status(400).json({ message: "Already put in favorites" });
        }
      }
      user.gamesFav.push(req.fields.game);
      user.markModified("gamesFav");

      await user.save();
      res.status(200).json("Bien ajouté.");
    } else {
      res.status(401).json("You need to be connected for this feature.");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// road for remove an favorite
router.post("/user/removeFavorites", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    for (let i = 0; i < user.gamesFav.length; i++) {
      if (user.gamesFav[i].id === req.fields.game.id) {
        user.gamesFav.splice(i, 1);
        user.markModified("gamesFav");
      }
    }
    await user.save();
    res.status(200).json({ message: "Favorite successfuly remove !" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
