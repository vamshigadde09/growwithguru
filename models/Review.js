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
  reviewTitle: {
    type: String,
    maxlength: 100,
  },
  feedbackCategory: {
    type: String,
    enum: ["Technical", "Communication", "Problem Solving"],
  },
  status: {
    type: String,
    enum: ["Active", "Archived"],
    default: "Active",
  },
});

module.exports = mongoose.model("Review", reviewSchema);
