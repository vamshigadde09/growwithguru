const InterviewRequest = require("../models/interviewRequestModel");
const TeacherProfile = require("../models/teacherporfile");
const Feedback = require("../models/feedbackModel");
const Review = require("../models/Review");

const generateUniqueApplicationNumber = async () => {
  let isUnique = false;
  let applicationNumber;
  while (!isUnique) {
    applicationNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    const existing = await InterviewRequest.findOne({ applicationNumber });
    if (!existing) isUnique = true;
  }
  return applicationNumber;
};

const createInterviewRequest = async (req, res) => {
  try {
    const {
      name,
      email,
      topic,
      skills,
      interviewType,
      experienceLevel,
      date,
      startTime,
      interviewMode,
      teacher = [],
      driveLink = "",
      resourcesLink = "",
      noteacher,
    } = req.body;

    if (!name || !email || !topic || !date || !startTime) {
      return res.status(400).send({
        message: "Required fields are missing.",
        success: false,
      });
    }

    const applicationNumber = await generateUniqueApplicationNumber();
    const studentName = req.user.name;
    const newRequest = new InterviewRequest({
      name,
      email,
      topic,
      skills,
      interviewType,
      experienceLevel,
      date,
      startTime,
      interviewMode,
      teacher,
      driveLink,
      resourcesLink,
      applicationNumber,
      studentId: req.user.id,
      studentName,
      noteacher,
    });

    await newRequest.save();

    if (!noteacher) {
      await notifySelectedTeachers(teacher, {
        name,
        email,
        topic,
        skills,
        interviewType,
        experienceLevel,
        date,
        startTime,
        interviewMode,
        driveLink,
        resourcesLink,
        applicationNumber,
      });
    }
    res.status(201).send({
      message: "Interview request created successfully.",
      success: true,
      data: { applicationNumber },
    });
  } catch (error) {
    console.error("Error creating interview request:", error.message);
    res.status(500).send({
      message: `Server Error: ${error.message}`,
      success: false,
    });
  }
};

const notifySelectedTeachers = async (teacherObjects, applicationDetails) => {
  try {
    const teacherIds = teacherObjects.map((teacher) => teacher.teacherId);

    const teachers = await TeacherProfile.find({ _id: { $in: teacherIds } });

    if (teachers.length === 0) {
      console.error("No teachers found for the provided IDs.");
      return;
    }

    await Promise.all(
      teachers.map(async (teacher) => {
        teacher.notifications.push({
          type: `New Interview Request by ${applicationDetails.name}`,
          applicationNumber: applicationDetails.applicationNumber,
          details: {
            email: applicationDetails.email,
            topic: applicationDetails.topic,
            skills: applicationDetails.skills,
            interviewType: applicationDetails.interviewType,
            experienceLevel: applicationDetails.experienceLevel,
            date: applicationDetails.date,
            startTime: applicationDetails.startTime,
            interviewMode: applicationDetails.interviewMode,
            driveLink: applicationDetails.driveLink,
            resourcesLink: applicationDetails.resourcesLink,
          },
        });

        await teacher.save();
      })
    );
  } catch (error) {
    console.error("Error notifying teachers:", error.message);
  }
};

const getStudentInterviewRequests = async (req, res) => {
  try {
    const applications = await InterviewRequest.find({ studentId: req.user.id })
      .populate({
        path: "teacher.teacherId",
        select: "name designation skills",
      })
      .exec();

    res.status(200).json({
      message: "Applications fetched successfully",
      success: true,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const rejectInterviewRequest = async (req, res) => {
  const { applicationNumber, teacherId, reason } = req.body;

  if (!reason || reason.trim() === "") {
    return res.status(400).send("Rejection reason is required.");
  }

  try {
    const interview = await InterviewRequest.findOne({ applicationNumber });

    const teacherEntry = interview.teacher.find(
      (t) => t.teacherId.toString() === teacherId
    );

    if (!teacherEntry) {
      return res
        .status(404)
        .send("Teacher not associated with this application.");
    }

    teacherEntry.rejectionReason = reason;
    teacherEntry.status = "Rejected";

    // Check if all teacher statuses are either Rejected or Accepted
    const allRejected = interview.teacher.every((t) => t.status === "Rejected");

    if (allRejected) {
      interview.status = "Rejected"; // Update global status
    }

    await interview.save();
    res.status(200).send({ message: "Rejection reason updated successfully." });
  } catch (error) {
    res.status(500).send({ message: "Server error: " + error.message });
  }
};

const acceptInterviewRequest = async (req, res) => {
  const { applicationNumber, teacherId, acceptedResponse } = req.body;

  try {
    const interview = await InterviewRequest.findOne({ applicationNumber });
    const teacherEntry = interview.teacher.find(
      (t) => t.teacherId.toString() === teacherId
    );
    teacherEntry.status = "Accepted";
    teacherEntry.acceptedResponse = acceptedResponse;

    interview.status = "Accepted";

    // Update teacher notifications
    const teacher = await TeacherProfile.findById(teacherId);
    const notificationIndex = teacher.notifications.findIndex(
      (n) => n.applicationNumber === applicationNumber
    );
    if (notificationIndex >= 0) {
      teacher.notifications[notificationIndex].status = "Accepted";
    }

    await teacher.save();
    await interview.save();

    res
      .status(200)
      .send({ message: "Acceptance response updated successfully." });
  } catch (error) {
    res.status(500).send({ message: "Server error: " + error.message });
  }
};

const getAcceptedRequests = async (req, res) => {
  try {
    const acceptedRequests = await InterviewRequest.find({
      status: { $in: ["Accepted"] },
    });
    res.status(200).json({ success: true, data: acceptedRequests });
  } catch (error) {
    console.error("Error fetching accepted requests:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAttendance = async (req, res) => {
  const { applicationNumber, attendance } = req.body;
  try {
    const interview = await InterviewRequest.findOneAndUpdate(
      { applicationNumber },
      { attendance },
      { new: true }
    );
    if (!interview) {
      return res.status(404).json({ message: "Interview request not found." });
    }
    res.status(200).json({ message: "Attendance updated.", data: interview });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const submitFeedback = async (req, res) => {
  const { applicationNumber, feedback } = req.body;

  try {
    // Step 1: Find the interview request

    const interview = await InterviewRequest.findOne({ applicationNumber });

    if (!interview) {
      console.log("Interview request not found.");
      return res.status(404).json({ message: "Interview request not found." });
    }

    // Step 2: Validate feedback fields
    const {
      interviewRequestId,
      studentId,
      teacherId,
      communicationSkills,
      technicalKnowledge,
      problemSolvingAbility,
      confidenceAndBodyLanguage,
      timeManagement,
      overallPerformance,
      strengths,
      areasForImprovement,
      detailedFeedback,
      actionableSuggestions,
      additionalComments,
      recommendation,
    } = feedback;

    if (
      !interviewRequestId ||
      !studentId ||
      !teacherId ||
      !communicationSkills ||
      !technicalKnowledge ||
      !problemSolvingAbility ||
      !confidenceAndBodyLanguage ||
      !timeManagement ||
      !overallPerformance ||
      !strengths ||
      !areasForImprovement
    ) {
      return res
        .status(400)
        .json({ message: "Missing required feedback fields." });
    }

    // Step 3: Check attendance status
    if (interview.attendance !== "Present") {
      console.log("Attendance is not marked as Present.", {
        attendance: interview.attendance,
      });
      return res.status(400).json({
        message:
          "Feedback can only be submitted if attendance is marked as Present.",
      });
    }

    // Step 4: Save feedback in the Feedback model
    const newFeedback = new Feedback({
      ...feedback,
      studentId: interview.studentId,
      interviewRequestId: interview._id,
    });
    await newFeedback.save(``);

    // Step 5: Update interview request with feedback details
    interview.feedbackId = newFeedback._id;
    interview.isFeedbackSubmitted = true;
    interview.status = "Completed";
    // Updated Code:
    interview.teacher.forEach((teacher) => {
      if (teacher.teacherId.toString() === teacherId.toString()) {
        teacher.status = "Completed";
      }
    });

    await interview.save();

    // Step 6: Notify teacher and update notification status
    const teacher = await TeacherProfile.findById(teacherId);
    if (teacher) {
      // Find and update the existing notification
      const notificationIndex = teacher.notifications.findIndex(
        (notification) => notification.applicationNumber === applicationNumber
      );

      if (notificationIndex !== -1) {
        teacher.notifications[notificationIndex].status = "Completed";
        teacher.notifications[notificationIndex].type = "Feedback Submitted";
        teacher.notifications[
          notificationIndex
        ].details.feedbackSummary = `Overall Performance: ${overallPerformance}`;
      }

      await teacher.save();
    }

    res.status(200).json({
      message: "Feedback submitted successfully.",
      data: { interview, feedbackId: newFeedback._id, status: "Completed" },
    });
  } catch (error) {
    console.error("Error in submitFeedback:", error.message);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const getFeedbackForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;

    const feedbacks = await Feedback.find({ studentId })
      .populate({
        path: "interviewRequestId",
        select: "applicationNumber topic date interviewType skills teacher",
        populate: {
          path: "teacher.teacherId",
          select: "name designation skills",
        },
      })
      .exec();

    const feedbackWithReviewStatus = await Promise.all(
      feedbacks.map(async (feedback) => {
        const review = await Review.findOne({
          interviewRequestId: feedback.interviewRequestId._id,
          studentId,
        });
        return {
          ...feedback._doc,
          reviewSubmitted: !!review,
        };
      })
    );
    console.log("Fetching feedbacks for studentId:", studentId);

    res.status(200).json({
      message: "Feedback fetched successfully",
      success: true,
      data: feedbackWithReviewStatus,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error.message);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const deleteStudentInterviewRequest = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const deletedRequest = await InterviewRequest.findByIdAndDelete(
      applicationId
    );
    if (!deletedRequest) {
      return res.status(404).json({ message: "Application not found." });
    }
    res.status(200).json({ message: "Application deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

const submitReview = async (req, res) => {
  const { interviewRequestId, starRating, reviewComment } = req.body;
  const studentId = req.user.id;

  if (!starRating || !reviewComment || !interviewRequestId) {
    return res.status(400).json({
      message:
        "All fields are required (interviewRequestId, starRating, reviewComment).",
    });
  }

  try {
    const interviewRequest = await InterviewRequest.findById(
      interviewRequestId
    );
    if (!interviewRequest) {
      return res.status(404).json({ message: "Invalid interviewRequestId." });
    }

    const existingReview = await Review.findOne({
      interviewRequestId,
      studentId,
    });
    if (existingReview) {
      return res.status(400).json({ message: "Review already submitted." });
    }

    const review = new Review({
      studentId,
      interviewRequestId,
      starRating,
      reviewComment,
    });
    await review.save();

    // Update feedback and interview request statuses
    await Feedback.updateOne(
      { interviewRequestId },
      { $set: { reviewSubmitted: true } }
    );
    await InterviewRequest.findByIdAndUpdate(
      interviewRequestId,
      { $set: { status: "Review Submitted" } },
      { new: true }
    );

    res
      .status(201)
      .json({ message: "Review submitted successfully.", data: review });
  } catch (error) {
    console.error("Error submitting review:", error.message);
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const shareInterviewRequest = async (req, res) => {
  const { applicationNumber, newTeacherId, shareDetails, StudentshareDetails } =
    req.body;

  if (
    !applicationNumber ||
    !newTeacherId ||
    !shareDetails ||
    !StudentshareDetails
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const interview = await InterviewRequest.findOne({ applicationNumber });

    if (!interview) {
      return res.status(404).json({ message: "Application not found." });
    }

    // Mark the current teacher's entry as "Sent"
    const currentTeacher = interview.teacher.find(
      (teacher) => teacher.status === "Accepted"
    );
    if (currentTeacher) {
      currentTeacher.status = "Shared"; // Change status to "Shared"
      currentTeacher.sentReceivedStatus = "Sent"; // Mark as Sent
    }

    // Add the new teacher and mark it as "Received"
    interview.teacher.push({
      teacherId: newTeacherId,
      shareDetails,
      StudentshareDetails,
      status: "Shared",
      sentReceivedStatus: "Received",
    });

    // **IMPORTANT:** Update global interview status
    interview.status = "Shared";

    await interview.save();

    // Notify the new teacher
    const teacher = await TeacherProfile.findById(newTeacherId);
    if (teacher) {
      teacher.notifications.push({
        type: "Shared Interview Request",
        applicationNumber,
        details: {
          email: interview.email,
          topic: interview.topic,
          skills: interview.skills,
          interviewType: interview.interviewType,
          experienceLevel: interview.experienceLevel,
          date: interview.date,
          startTime: interview.startTime,
          interviewMode: interview.interviewMode,
          shareDetails,
          StudentshareDetails,
        },
        status: "Shared",
        sentReceivedStatus: "Received",
      });
      await teacher.save();
    }

    res.status(200).json({
      message: "Application shared successfully.",
      success: true,
      data: interview,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

module.exports = {
  createInterviewRequest,
  getStudentInterviewRequests,
  notifySelectedTeachers,
  rejectInterviewRequest,
  getAcceptedRequests,
  acceptInterviewRequest,
  submitFeedback,
  updateAttendance,
  getFeedbackForStudent,
  deleteStudentInterviewRequest,
  submitReview,
  shareInterviewRequest,
};
