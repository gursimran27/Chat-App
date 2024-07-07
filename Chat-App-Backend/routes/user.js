const router = require("express").Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post(
  "/generate-zego-token",
  authController.protect,
  userController.generateZegoToken
);
router.get("/get-call-logs", authController.protect, userController.getCallLogs);
router.get("/get-me", authController.protect, userController.getMe);
router.patch("/update-me", authController.protect, userController.updateMe); 
router.get("/get-all-verified-users", authController.protect, userController.getAllVerifiedUsers);
router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-requests", authController.protect, userController.getRequests);
router.get("/get-friends", authController.protect, userController.getFriends);
router.get("/:id/lastSeen", authController.protect, userController.lastSeen);

router.post("/start-audio-call", authController.protect, userController.startAudioCall);
router.post("/start-video-call", authController.protect, userController.startVideoCall);

router.put("/upload", authController.protect, userController.upload);

router.put("/conversations/:id/unpin", authController.protect, userController.unpin);
router.put("/conversations/:id/pin", authController.protect, userController.pin);

router.put("/conversations/:conversationId/:messageId/star", authController.protect, userController.star);

router.get("/messages/:conversationId/:page", authController.protect, userController.fetchMsg);

router.get("/starmessages/:conversationID", authController.protect, userController.fetchStarMsg);

router.get("/mediamessages/:conversationID", authController.protect, userController.fetchMediaMsg);

router.delete('/deletemessage/:conversationId/:messageId', authController.protect, userController.deleteMessageForUser);

router.put('/updatedeleteforeveryone/:conversationId/:messageId', authController.protect, userController.updateDeleteForEveryone);


module.exports = router;
