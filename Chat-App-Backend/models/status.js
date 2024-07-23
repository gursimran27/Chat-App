const mongoose = require("mongoose");
const User = require("./user");

const statusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  filePath: { type: String, default: null },
  type: {
    type: String,
    enum: ["doc", "img", "video"],
  },
  createdAt: { type: Date, default: Date.now, expires: "24h" }, // Automatically delete after 24 hours
});

statusSchema.post("remove", async function (doc) {
  try {
    await User.findByIdAndUpdate(doc.userId, { $pull: { statuses: doc._id } });
  } catch (err) {
    console.error("Error removing status from user:", err);
  }
});

const Status = mongoose.model("Status", statusSchema);
module.exports = Status;
