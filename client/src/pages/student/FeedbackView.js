import React, { useState, useEffect } from "react";
import axios from "axios";
import StudentHeader from "../Header/StudentHeader";
import Footer from "../Footer/Footer";
import "../../styles/FeedbackView.css";
import { Rating } from "react-simple-star-rating";

const FeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/v1/interview/studentFeedback",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Sort feedbacks by date in descending order (latest first)
      const sortedFeedbacks = response.data.data.sort(
        (a, b) =>
          new Date(b.interviewRequestId.date) -
          new Date(a.interviewRequestId.date)
      );
      setFeedbacks(sortedFeedbacks);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      setError(err.response?.data?.message || "Failed to load feedbacks.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading feedbacks...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const currentFeedbacks = feedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(feedbacks.length / itemsPerPage);

  const FeedbackItem = ({ feedback }) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [starRating, setStarRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [showDetails, setShowDetails] = useState(false);

    const handleRating = (rating) => setStarRating(rating);

    const handleFeedbackSubmit = async () => {
      if (starRating === 0 || reviewComment.trim() === "") {
        alert("Please provide both a star rating and a comment.");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:8080/api/v1/interview/submit",
          {
            interviewRequestId: feedback.interviewRequestId._id,
            starRating,
            reviewComment,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Review submitted successfully!");
        setShowReviewForm(false);
        fetchFeedbacks(); // Refresh the feedback list
      } catch (err) {
        console.error("Error submitting review:", err);
        alert("Failed to submit review.");
      }
    };

    return (
      <li className="feedback-item">
        <h3>
          Feedback for Application #{" "}
          {feedback.interviewRequestId?.applicationNumber}
        </h3>
        <div className="feedback-details">
          <p className="feedback-topic">
            <strong>Topic:</strong> {feedback.interviewRequestId?.topic}
          </p>
          <p className="feedback-interviewType">
            <strong>Interview Type:</strong>{" "}
            {feedback.interviewRequestId?.interviewType}
          </p>
          <p className="feedback-skills">
            <strong>Skills:</strong> {feedback.interviewRequestId?.skills}
          </p>
          <p className="feedback-date">
            <strong>Date:</strong>{" "}
            {new Date(feedback.interviewRequestId?.date).toLocaleDateString()}
          </p>
          {feedback.interviewRequestId?.teacher?.map((teacher) => (
            <div key={teacher.teacherId?._id} className="teacher-details">
              <p>
                <strong>Teacher Name:</strong> {teacher.teacherId?.name}
              </p>
              <p>
                <strong>Designation:</strong> {teacher.teacherId?.designation}
              </p>
              <p>
                <strong>Skills:</strong>{" "}
                {teacher.teacherId?.skills
                  ?.map((skill) => skill.skillName)
                  .join(", ")}
              </p>
            </div>
          ))}
        </div>
        {showDetails && (
          <div className="feedback-details">
            <div className="detailed-feedback">
              <h4 className="detailed-feedback-title">Detailed Feedback</h4>
              <p className="feedback-communication-skills">
                <strong>Communication Skills:</strong>{" "}
                <span className="feedback-communication-skills-value">
                  {feedback.communicationSkills}
                </span>
              </p>
              <p className="feedback-technical-knowledge">
                <strong>Technical Knowledge:</strong>{" "}
                <span className="feedback-technical-knowledge-value">
                  {feedback.technicalKnowledge}
                </span>
              </p>
              <p className="feedback-problem-solving">
                <strong>Problem-Solving Ability:</strong>{" "}
                <span className="feedback-problem-solving-value">
                  {feedback.problemSolvingAbility}
                </span>
              </p>
              <p className="feedback-confidence-body-language">
                <strong>Confidence and Body Language:</strong>{" "}
                <span className="feedback-confidence-body-language-value">
                  {feedback.confidenceAndBodyLanguage}
                </span>
              </p>
              <p className="feedback-time-management">
                <strong>Time Management:</strong>{" "}
                <span className="feedback-time-management-value">
                  {feedback.timeManagement}
                </span>
              </p>
              <p className="feedback-overall-performance">
                <strong>Overall Performance:</strong>{" "}
                <span className="feedback-overall-performance-value">
                  {feedback.overallPerformance}
                </span>
              </p>
              <p className="feedback-strengths">
                <strong>Strengths:</strong>{" "}
                <span className="feedback-strengths-value">
                  {feedback.strengths}
                </span>
              </p>
              <p className="feedback-areas-for-improvement">
                <strong>Areas for Improvement:</strong>{" "}
                <span className="feedback-areas-for-improvement-value">
                  {feedback.areasForImprovement}
                </span>
              </p>
              <p className="feedback-opening-statement">
                <strong>Opening Statement:</strong>{" "}
                <span className="feedback-opening-statement-value">
                  {feedback.detailedFeedback?.openingStatement}
                </span>
              </p>
              <p className="feedback-technical-analysis">
                <strong>Technical Analysis:</strong>{" "}
                <span className="feedback-technical-analysis-value">
                  {feedback.detailedFeedback?.technicalAnalysis}
                </span>
              </p>
              <p className="feedback-problem-solving-discussion">
                <strong>Problem Solving Discussion:</strong>{" "}
                <span className="feedback-problem-solving-discussion-value">
                  {feedback.detailedFeedback?.problemSolvingDiscussion}
                </span>
              </p>
              <p className="feedback-communication-observations">
                <strong>Communication Observations:</strong>{" "}
                <span className="feedback-communication-observations-value">
                  {feedback.detailedFeedback?.communicationObservations}
                </span>
              </p>
              <p className="feedback-behavioral-assessment">
                <strong>Behavioral Assessment:</strong>{" "}
                <span className="feedback-behavioral-assessment-value">
                  {feedback.detailedFeedback?.behavioralAssessment}
                </span>
              </p>
              <p className="feedback-closing-remarks">
                <strong>Closing Remarks:</strong>{" "}
                <span className="feedback-closing-remarks-value">
                  {feedback.detailedFeedback?.closingRemarks}
                </span>
              </p>
            </div>
            <div className="additional-feedback">
              <p className="feedback-actionable-suggestions">
                <strong>Actionable Suggestions:</strong>{" "}
                <span className="feedback-actionable-suggestions-value">
                  {feedback.actionableSuggestions.join(", ")}
                </span>
              </p>
              <p className="feedback-additional-comments">
                <strong>Additional Comments:</strong>{" "}
                <span className="feedback-additional-comments-value">
                  {feedback.additionalComments}
                </span>
              </p>
              <p className="feedback-recommendation">
                <strong>Recommendation:</strong>{" "}
                <span className="feedback-recommendation-value">
                  {feedback.recommendation ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>
        )}

        {!feedback.reviewSubmitted ? (
          <button
            className="feedback-button give-review-button"
            onClick={() => setShowReviewForm(true)}
          >
            Give Review
          </button>
        ) : (
          <p className="review-submitted-message">Review already submitted.</p>
        )}
        {showReviewForm && (
          <div className="feedback-form">
            <label className="feedback-label">
              Star Rating:
              <Rating
                onClick={handleRating}
                ratingValue={starRating}
                allowHalfIcon
                size={25}
                showTooltip
                tooltipArray={[
                  "Terrible",
                  "Bad",
                  "Average",
                  "Good",
                  "Excellent",
                ]}
              />
            </label>
            <label className="feedback-label">
              Review:
              <textarea
                className="feedback-textarea"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </label>
            <div className="feedback-buttons">
              <button
                className="feedback-button submit-review-button"
                onClick={handleFeedbackSubmit}
              >
                Submit Review
              </button>
              <button
                className="feedback-button close-review-button"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <button
          className="feedback-button view-more-button"
          onClick={() => setShowDetails((prev) => !prev)}
        >
          {showDetails ? "View Less" : "View More"}
        </button>
      </li>
    );
  };

  return (
    <div className="feedback-view">
      <StudentHeader />
      <div className="feedback-container">
        <h1>Your Feedback</h1>
        {feedbacks.length === 0 ? (
          <p>No feedback available yet.</p>
        ) : (
          <>
            <ul>
              {currentFeedbacks.map((feedback) => (
                <FeedbackItem key={feedback._id} feedback={feedback} />
              ))}
            </ul>
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  className={`pagination-button ${
                    currentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FeedbackView;
