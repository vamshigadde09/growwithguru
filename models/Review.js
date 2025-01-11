const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  interviewRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewRequest",
    required: true,
  },
  starRating: {
    type: Number,
    min: 0,
    max: 5,
    required: true,
  },

  reviewComment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
