var express = require("express");
var router = express.Router();
var multer = require("multer");
var path = require("path");
var fs = require("fs");
let messageModel = require("../schemas/messages");
let { CheckLogin } = require("../utils/authHandler");
let mongoose = require("mongoose");

// ─── Multer Config ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });
// Dùng .any() để chấp nhận file từ bất kỳ field name nào
const uploadAny = upload.any();
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/messages/
 * Lấy tin nhắn CUỐI CÙNG của mỗi cuộc hội thoại mà user hiện tại tham gia.
 */
router.get("/", CheckLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;

    const conversations = await messageModel.aggregate([
      {
        $match: {
          $or: [
            { from: new mongoose.Types.ObjectId(currentUserId) },
            { to: new mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ["$from", new mongoose.Types.ObjectId(currentUserId)] },
              then: "$to",
              else: "$from"
            }
          }
        }
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$lastMessage" } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "from",
          foreignField: "_id",
          as: "from"
        }
      },
      { $unwind: "$from" },
      {
        $lookup: {
          from: "users",
          localField: "to",
          foreignField: "_id",
          as: "to"
        }
      },
      { $unwind: "$to" },
      {
        $project: {
          "from._id": 1, "from.username": 1, "from.fullName": 1, "from.avatarUrl": 1,
          "to._id": 1, "to.username": 1, "to.fullName": 1, "to.avatarUrl": 1,
          messageContent: 1,
          createdAt: 1
        }
      }
    ]);

    res.send(conversations);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/**
 * POST /api/v1/messages/
 * Gửi tin nhắn. Dùng multipart/form-data.
 *
 * Nếu gửi text: field "to" + "text" (không đính kèm file)
 * Nếu gửi file: field "to" + file field tên "file"
 */
router.post("/", CheckLogin, uploadAny, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const { to, text } = req.body;

    if (!to) return res.status(400).send({ message: '"to" (userID) là bắt buộc' });

    let type, content;

    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;

    if (uploadedFile) {
      // Có file đính kèm → type = "file", text = đường dẫn server lưu file
      type = "file";
      content = `/uploads/${uploadedFile.filename}`;
    } else if (text && text.trim() !== "") {
      // Không có file → type = "text"
      type = "text";
      content = text.trim();
    } else {
      return res.status(400).send({ message: 'Phải gửi "text" hoặc đính kèm "file"' });
    }

    const newMessage = new messageModel({
      from: currentUserId,
      to,
      messageContent: { type, text: content }
    });

    const saved = await newMessage.save();

    const populated = await messageModel
      .findById(saved._id)
      .populate("from", "username fullName avatarUrl")
      .populate("to", "username fullName avatarUrl");

    res.status(201).send(populated);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

/**
 * GET /api/v1/messages/:userID
 * Lấy toàn bộ tin nhắn giữa user hiện tại và userID.
 */
router.get("/:userID", CheckLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userID;

    const messages = await messageModel
      .find({
        $or: [
          { from: currentUserId, to: targetUserId },
          { from: targetUserId, to: currentUserId }
        ]
      })
      .populate("from", "username fullName avatarUrl")
      .populate("to", "username fullName avatarUrl")
      .sort({ createdAt: 1 });

    res.send(messages);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
