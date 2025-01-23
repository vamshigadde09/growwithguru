import React from "react";
import "../styles/RegiserStyles.css";
import { Form, Input, Select, message } from "antd";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showLoading, hideLoading } from "../redux/features/alertSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onFinishHandler = async (values) => {
    try {
      dispatch(showLoading());
      const response = await axios.post("/api/v1/user/register", values);
      dispatch(hideLoading());
      if (response.data.success) {
        message.success("Registered successfully!");
        navigate("/login");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      dispatch(hideLoading());
      console.error(error);
      message.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="center-container">
      <div className="form-container">
        <Form
          layout="vertical"
          onFinish={onFinishHandler}
          className="custom-form"
        >
          <h3 className="text-center">Register</h3>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select>
              <Select.Option value="Teacher">Teacher</Select.Option>
              <Select.Option value="Student">Student</Select.Option>
            </Select>
          </Form.Item>
          <Link to="/login" className="custom-link">
            Already a user? Login here
          </Link>
          <button className="custom-btn" type="submit">
            Register
          </button>
        </Form>
      </div>
    </div>
  );
};

export default Register;
