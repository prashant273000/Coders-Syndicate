const express = require("express");
const router = express.Router();
const {
  inviteFriendToMatch,
  getPendingMatchInvites,
  acceptMatchInvite,
  declineMatchInvite,
  getMatchByRoomId,
} = require("../controllers/matchController");

router.post("/invite-friend", inviteFriendToMatch);
router.get("/invites/:uid", getPendingMatchInvites);
router.post("/accept-invite", acceptMatchInvite);
router.post("/decline-invite", declineMatchInvite);
router.get("/room/:roomId", getMatchByRoomId);

module.exports = router;