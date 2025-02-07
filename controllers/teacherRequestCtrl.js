const InterviewRequest = require("../models/interviewRequestModel");
const TeacherProfile = require("../models/teacherporfile");
const Review = require("../models/Review");

// Fetch teacher notifications
const getTeacherNotifications = async (req, res) => {
  try {
    const teacher = await TeacherProfile.findOne({ userId: req.user.id });

    if (!teacher) {
      console.log("No teacher profile found for User ID:", req.user.id);
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const notifications = teacher.notifications.map((notification) => {
      const currentTeacherStatus = notification.status || "Pending"; // Default to "Pending" if not set
      return {
        ...notification.toObject(),
        teacherId: teacher._id, // Attach the teacher's ID
        status: currentTeacherStatus, // Use the updated status from the database
      };
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching teacher notifications:", error.message);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Update notification status
const updateNotificationStatus = async (req, res) => {
  const { applicationNumber } = req.params;
  const { status, reason, acceptedResponse } = req.body;

  try {
    const updatedRequest = await InterviewRequest.findOneAndUpdate(
      { applicationNumber: Number(applicationNumber) },
      {
        status,
        rejectionReason: reason || "",
        acceptedResponse: acceptedResponse || "",
      },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

// Update teacher availability
const updateTeacherAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || availability.length === 0) {
      return res.status(400).json({ message: "Availability cannot be empty." });
    }

    const teacher = await TeacherProfile.findOne({ userId: req.user.id });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found." });
    }

    teacher.availability = availability;

    await teacher.save();
    res.status(200).json({
      message: "Availability updated successfully.",
      data: teacher.availability,
    });
  } catch (error) {
    console.error("Error in updateTeacherAvailability:", error.message);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// Get teacher availability
const getTeacherAvailability = async (req, res) => {
  try {
    const teacher = await TeacherProfile.findOne({ userId: req.user.id });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found." });
    }

    res.status(200).json({
      message: "Availability fetched successfully.",
      data: teacher.availability,
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const getTeacherDetails = async (req, res) => {
  try {
    const teacher = await TeacherProfile.findOne({ _id: req.params.id })
      .populate("userId", "email") // Populate email from User model
      .select(
        "name profilePicture designation department skills availability availabilityNotes areasOfExpertise preferredNotificationMethod publications linkedIn otherProfessionalLinks"
      );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }
    const teacherData = {
      ...teacher.toObject(),
      email: teacher.userId.email,
    };

    res.status(200).json({ data: teacherData });
  } catch (error) {
    console.error("Error fetching teacher details:", error.message);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const attendance = async (req, res) => {
  const { applicationNumber, attendance } = req.body;
  if (!applicationNumber || !attendance) {
    return res.status(400).send("Missing applicationNumber or attendance.");
  }
  try {
    const interview = await InterviewRequest.findOneAndUpdate(
      { applicationNumber },
      { attendance },
      { new: true }
    );
    res.status(200).json({ message: "Attendance updated.", data: interview });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const feedback = async (req, res) => {
  const { applicationNumber, feedback } = req.body;
  if (!applicationNumber || !feedback) {
    return res.status(400).send("Missing applicationNumber or feedback.");
  }
  try {
    const interview = await InterviewRequest.findOneAndUpdate(
      { applicationNumber },
      { feedback },
      { new: true }
    );
    res.status(200).json({ message: "Feedback submitted.", data: interview });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};
const getReviewByApplicationNumber = async (req, res) => {
  const { applicationNumber } = req.params;

  try {
    const interviewRequest = await InterviewRequest.findOne({
      applicationNumber,
    });
    if (!interviewRequest) {
      return res.status(404).json({ message: "Interview request not found." });
    }

    const review = await Review.findOne({
      interviewRequestId: interviewRequest._id,
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    res.status(200).json({ review });
  } catch (error) {
    console.error("Error fetching review:", error.message);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

module.exports = {
  getTeacherNotifications,
  updateNotificationStatus,
  updateTeacherAvailability,
  getTeacherAvailability,
  getTeacherDetails,
  feedback,
  attendance,
  getReviewByApplicationNumber,
};
