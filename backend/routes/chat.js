// routes/chat.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");
const { responder } = require("../controllers/chatController");

router.post("/", authenticate, responder);

module.exports = router;