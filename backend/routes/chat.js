// routes/chat.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const { sendMessage } = require("../controllers/chatController");

router.post("/message", authenticate, sendMessage);

module.exports = router;