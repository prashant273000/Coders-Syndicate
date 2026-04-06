const User = require("../models/user");
const FriendRequest = require("../models/FriendRequest");

exports.searchUsers = async (req, res) => {
  try {
    const { q, currentUid } = req.query;

    if (!q?.trim()) {
      return res.json([]);
    }

    const users = await User.find({
      uid: { $ne: currentUid },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { uid: { $regex: q, $options: "i" } },
      ],
    }).select("_id uid name email picture");

    res.json(users);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    const { senderUid, receiverUid } = req.body;

    if (senderUid === receiverUid) {
      return res.status(400).json({ error: "You cannot send request to yourself" });
    }

    const sender = await User.findOne({ uid: senderUid });
    const receiver = await User.findOne({ uid: receiverUid });

    if (!sender || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already friends using MongoDB ObjectIds
    const isAlreadyFriend = sender.friends.some(
      (friendId) => friendId.toString() === receiver._id.toString()
    );

    if (isAlreadyFriend) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Check if pending request already exists
    const existing = await FriendRequest.findOne({
      sender: sender._id,
      receiver: receiver._id,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ error: "Request already sent" });
    }

    // Check if reverse pending request exists
    const reverse = await FriendRequest.findOne({
      sender: receiver._id,
      receiver: sender._id,
      status: "pending",
    });

    if (reverse) {
      return res.status(400).json({ error: "This user already sent you a request" });
    }

    // Create friend request
    const request = await FriendRequest.create({
      sender: sender._id,
      receiver: receiver._id,
    });

    res.json({ message: "Friend request sent", request });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const requests = await FriendRequest.find({
      receiver: user._id,
      status: "pending",
    }).populate("sender", "uid name email picture");

    const formatted = requests.map((reqDoc) => ({
      id: reqDoc._id,
      senderId: reqDoc.sender._id,
      uid: reqDoc.sender.uid,
      name: reqDoc.sender.name,
      photoURL: reqDoc.sender.picture,
      league: "Champion's League",
      rank: "Diamond Tier",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Pending request not found" });
    }

    request.status = "accepted";
    await request.save();

    // Add to both users' friends arrays
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: request.receiver },
    });

    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: { friends: request.sender },
    });

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Pending request not found" });
    }

    request.status = "declined";
    await request.save();

    res.json({ message: "Friend request declined" });
  } catch (err) {
    console.error("Decline request error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFriendsList = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid }).populate("friends", "uid name email picture");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter out any null/undefined friends and format
    const friends = user.friends
      .filter(f => f != null)
      .map((f) => ({
        id: f._id,
        uid: f.uid,
        name: f.name,
        picture: f.picture,
        photoURL: f.picture, // Add both field names for compatibility
      }));

    res.json(friends);
  } catch (err) {
    console.error("Get friends list error:", err);
    res.status(500).json({ error: err.message });
  }
};