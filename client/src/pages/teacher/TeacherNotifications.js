import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/TeacherNotifications.css";
import Footer from "../Footer/Footer";
import TeacherHeader from "../Header/TeacherHeader";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
const TeacherNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState({}); // Stores reviews by application number
  const [responseReasons, setResponseReasons] = useState({});
  const [editingType, setEditingType] = useState({}); // Keeps track of editing type (accept/reject)
  const [activeTab, setActiveTab] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Display 5 applications per page
  const [suggestedTeachers, setSuggestedTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [StudentshareDetails, setStudentshareDetails] = useState("");
  const [shareDetails, setShareDetails] = useState("");

  // Fetch teacher notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/v1/teacher/notifications",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Sort notifications by createdAt or timestamp in descending order
      const sortedNotifications = response.data.notifications.reverse();

      const notifications = response.data.notifications.map((notification) => ({
        ...notification,
        status: notification.status || "Pending", // Ensure fallback for missing statuses
      }));
      setNotifications(notifications);

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
    }
  };

  // Fetch review for an application
  const fetchReview = async (applicationNumber) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8080/api/v1/teacher/review/${applicationNumber}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews((prev) => ({
        ...prev,
        [applicationNumber]: response.data.review,
      }));
    } catch (error) {}
  };

  const handleShare = async (applicationNumber) => {
    console.log("Sharing application:", {
      applicationNumber,
      newTeacherId: selectedTeacher?.id || selectedTeacher?._id,
      shareDetails,
      StudentshareDetails,
    });

    if (
      !shareDetails.trim() ||
      !StudentshareDetails.trim() ||
      !selectedTeacher
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8080/api/v1/interview/share",
        {
          applicationNumber,
          newTeacherId: selectedTeacher.id || selectedTeacher._id,
          shareDetails,
          StudentshareDetails,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("API response:", response.data);

      // **Ensure the notification state updates correctly**
      fetchNotifications(); // Refresh the notifications immediately

      alert(response.data.message || "Application shared successfully!");
    } catch (error) {
      console.error(
        "Error sharing notification:",
        error.response?.data?.message
      );
      alert(error.response?.data?.message || "Failed to share.");
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:8080/api/v1/teacher/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotifications(notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error.message);
      }
    };
    fetchNotifications();
  }, []);

  const fetchSuggestedTeachers = async (name) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:8080/api/v1/user/searchTeachers",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { name },
        }
      );
      setSuggestedTeachers(response.data.data);
    } catch (error) {
      console.error("Error fetching suggested teachers:", error.message);
    }
  };

  const handleSearchTermChange = (value) => {
    if (value.trim()) {
      fetchSuggestedTeachers(value);
    } else {
      setSuggestedTeachers([]);
    }
  };

  // Fetch reviews for completed notifications
  useEffect(() => {
    notifications
      .filter((notification) => notification.status === "Completed")
      .forEach((notification) => {
        if (!reviews[notification.applicationNumber]) {
          fetchReview(notification.applicationNumber);
        }
      });
  }, [notifications, reviews]);

  // Handle input changes for acceptance/rejection
  const handleResponseChange = (applicationNumber, response) => {
    setResponseReasons((prev) => ({
      ...prev,
      [applicationNumber]: response,
    }));
  };

  // Update notification status locally
  const updateNotificationStatus = (applicationNumber, newStatus) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.applicationNumber === applicationNumber
          ? { ...notification, status: newStatus }
          : notification
      )
    );
  };

  // Handle rejection action
  const handleRejection = async (applicationNumber, teacherId) => {
    const reason = responseReasons[applicationNumber];
    if (!reason || reason.trim() === "") {
      alert("Rejection reason cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/v1/interview/reject",
        { applicationNumber, teacherId, reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(response.data.message || "Rejection submitted successfully!");

      // Update the global status to Rejected
      updateNotificationStatus(applicationNumber, "Rejected");
      // Update the state to reflect the rejected status
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.applicationNumber === applicationNumber
            ? { ...notification, status: "Rejected" }
            : notification
        )
      );
      await fetchNotifications();
      setEditingType({}); // Clear editing state
    } catch (error) {
      console.error("Error rejecting application:", error.message);
      alert("Failed to submit rejection.");
    }
  };

  // Handle accept action
  const handleAccept = async (applicationNumber, teacherId) => {
    const acceptedResponse = responseReasons[applicationNumber];
    if (!acceptedResponse || acceptedResponse.trim() === "") {
      alert("Acceptance response cannot be empty.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/v1/interview/accept",
        { applicationNumber, teacherId, acceptedResponse },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(response.data.message || "Acceptance submitted successfully!");

      // Update the global status to Accepted if any teacher accepts
      updateNotificationStatus(applicationNumber, "Accepted");

      setEditingType({}); // Clear editing state
    } catch (error) {
      console.error("Error accepting application:", error.message);
      alert("Failed to submit acceptance.");
    }
  };

  // Filter notifications based on the active tab

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "Shared") {
      return notification.status === "Shared"; // Show only shared notifications
    } else if (activeTab === "Sent" && activeTab === "Shared") {
      return (
        notification.status === "Shared" &&
        notification.sentReceivedStatus === "Sent"
      );
    } else if (activeTab === "Received" && activeTab === "Shared") {
      return (
        notification.status === "Shared" &&
        notification.sentReceivedStatus === "Received"
      );
    }
    return notification.status === activeTab;
  });

  useEffect(() => {
    fetchNotifications().catch((error) => {
      console.error("Failed to fetch notifications:", error);
    });
  }, []);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  return (
    <div className="notifications-container">
      <TeacherHeader />
      <h1 className="notifications-header">Teacher Notifications</h1>
      <div className="tabs">
        {["Pending", "Accepted", "Rejected", "Completed", "Shared"].map(
          (status) => (
            <button
              key={status}
              className={`tab-button ${activeTab === status ? "active" : ""}`}
              onClick={() => setActiveTab(status)}
            >
              {status}
            </button>
          )
        )}
      </div>

      {/* Show "Sent" and "Received" tabs ONLY when "Shared" is active */}
      {activeTab === "Shared" && (
        <div className="tabs">
          {["Sent", "Received"].map((status) => (
            <button
              key={status}
              className={`tab-button ${activeTab === status ? "active" : ""}`}
              onClick={() => setActiveTab(status)}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      <div className="notifications-list">
        {paginatedNotifications.length === 0 ? (
          <p className="no-notifications">
            No notifications found under "{activeTab}" status.
          </p>
        ) : (
          paginatedNotifications.map((notification) => (
            <div
              key={notification.applicationNumber}
              className="notification-card"
            >
              <div className="notification-content">
                <p>
                  <strong>Application Number:</strong>{" "}
                  {notification.applicationNumber || "N/A"}
                </p>
                <p>
                  <strong>Topic:</strong> {notification.details?.topic || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {notification.details?.email || "N/A"}
                </p>
                <p>
                  <strong>Skills:</strong>{" "}
                  {notification.details?.skills?.join(", ") || "N/A"}
                </p>
                <p>
                  <strong>Interview Type:</strong>{" "}
                  {notification.details?.interviewType || "N/A"}
                </p>
                <p>
                  <strong>Experience Level:</strong>{" "}
                  {notification.details?.experienceLevel || "N/A"}
                </p>
                <p>
                  <strong>Interview Mode:</strong>{" "}
                  {notification.details?.interviewMode || "N/A"}
                </p>
                <p>
                  <strong>Date:</strong> {notification.details?.date || "N/A"}
                </p>
                <p>
                  <strong>Start Time:</strong>{" "}
                  {notification.details?.startTime || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`notification-status ${notification.status.toLowerCase()}`}
                  >
                    {notification.status}
                  </span>
                </p>
              </div>

              {/* Show review only for Completed status */}
              {notification.status === "Completed" &&
                reviews[notification.applicationNumber] && (
                  <div className="student-review">
                    <h3 className="review-header">Student Review:</h3>
                    <p className="review-rating">
                      <strong>Rating:</strong>{" "}
                      {reviews[notification.applicationNumber].starRating ||
                        "N/A"}{" "}
                      / 5
                    </p>
                    <p className="review-comment">
                      <strong>Comment:</strong>{" "}
                      {reviews[notification.applicationNumber].reviewComment ||
                        "N/A"}
                    </p>
                  </div>
                )}

              <div className="notification-actions">
                {/* Hide Accept and Reject buttons for statuses other than Pending */}
                {notification.status === "Pending" &&
                  (editingType[notification.applicationNumber] ? (
                    <>
                      <textarea
                        placeholder={
                          editingType[notification.applicationNumber] ===
                          "Reject"
                            ? "Enter rejection reason"
                            : "Enter acceptance response"
                        }
                        value={
                          responseReasons[notification.applicationNumber] || ""
                        }
                        onChange={(e) =>
                          handleResponseChange(
                            notification.applicationNumber,
                            e.target.value
                          )
                        }
                      />
                      <button
                        onClick={() =>
                          editingType[notification.applicationNumber] ===
                          "Reject"
                            ? handleRejection(
                                notification.applicationNumber,
                                notification.teacherId
                              )
                            : handleAccept(
                                notification.applicationNumber,
                                notification.teacherId
                              )
                        }
                      >
                        Submit
                      </button>
                      <button
                        onClick={() =>
                          setEditingType((prev) => ({
                            ...prev,
                            [notification.applicationNumber]: null,
                          }))
                        }
                        style={{ marginLeft: "10px" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setEditingType((prev) => ({
                            ...prev,
                            [notification.applicationNumber]: "Accept",
                          }))
                        }
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          setEditingType((prev) => ({
                            ...prev,
                            [notification.applicationNumber]: "Reject",
                          }))
                        }
                      >
                        Reject
                      </button>
                    </>
                  ))}

                {/* Show Share button only for "Accepted" notifications */}
                <div className="notification-actions">
                  {/* Show Share button only for "Accepted" notifications */}
                  {notification.status === "Accepted" && (
                    <>
                      <button
                        onClick={() =>
                          setEditingType((prev) => ({
                            ...prev,
                            [notification.applicationNumber]: "Share",
                          }))
                        }
                      >
                        Share
                      </button>
                      {editingType[notification.applicationNumber] ===
                        "Share" && (
                        <>
                          <Autocomplete
                            options={suggestedTeachers}
                            getOptionLabel={(option) =>
                              option.name || "No Name"
                            } // Adjust based on actual teacher object
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Search Teacher"
                                placeholder="Type a teacher's name"
                                variant="outlined"
                                onChange={(e) =>
                                  handleSearchTermChange(e.target.value)
                                }
                              />
                            )}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                setSelectedTeacher(newValue); // Set the selected teacher object
                              } else {
                                setSelectedTeacher(null); // Handle case where selection is cleared
                              }
                            }}
                            style={{ marginBottom: "10px" }}
                          />

                          <textarea
                            placeholder="Enter reason for sharing"
                            value={shareDetails}
                            onChange={(e) => setShareDetails(e.target.value)} // Update shareDetails state
                          />
                          <textarea
                            placeholder="Enter student sharing details"
                            value={StudentshareDetails}
                            onChange={(e) =>
                              setStudentshareDetails(e.target.value)
                            } // Update StudentshareDetails state
                          />
                          <button
                            onClick={() =>
                              handleShare(
                                notification.applicationNumber,
                                selectedTeacher
                              )
                            }
                          >
                            Submit
                          </button>
                          <button
                            onClick={() =>
                              setEditingType((prev) => ({
                                ...prev,
                                [notification.applicationNumber]: null,
                              }))
                            }
                            style={{ marginLeft: "10px" }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`pagination-button ${
                  currentPage === pageNumber ? "active" : ""
                }`}
              >
                {pageNumber}
              </button>
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TeacherNotifications;
