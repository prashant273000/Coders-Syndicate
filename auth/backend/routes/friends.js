const express = require("express");
const router = express.Router();
const {
  searchUsers,
  sendRequest,
  getRequests,
  acceptRequest,
  declineRequest,
  getFriendsList,
} = require("../controllers/FriendsController");

router.get("/search", searchUsers);
router.post("/request", sendRequest);
router.get("/requests/:uid", getRequests);
router.post("/accept", acceptRequest);
router.post("/decline", declineRequest);
router.get("/list/:uid", getFriendsList);

module.exports = router;