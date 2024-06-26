const mongoose = require("mongoose");

const oneToOneMessageSchema = new mongoose.Schema({
  participants: [//array
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      to: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      from: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        enum: ["Text", "doc", "reply", "Link","img", "video"],
      },
      created_at: {
        type: Date,
        default: Date.now(),
      },
      text: {
        type: String,
      },
      file: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        enum: ["Sent", "Delivered","Seen"],
        default: "Sent",
      },
      replyToMsg: {
        type: String,
        default: null,
      },
      star: {
        type: Map,
        of: Boolean,
        default: {},
      },
    },
  ],
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
});

const OneToOneMessage = new mongoose.model(
  "OneToOneMessage",
  oneToOneMessageSchema
);
module.exports = OneToOneMessage;
