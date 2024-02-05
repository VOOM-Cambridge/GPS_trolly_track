import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

const EditForm = () => {
  const [formData, setFormData] = useState({
    idorder: "",
    factory: "",
    job_complete: "",
    job_planned: "",
    order_status: "",
  });
  const location = useLocation();
  const nameId = location.pathname.split("/")[3];
  const navigate = useNavigate();
  console.log(nameId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:8800/orderGet/${nameId}`);
        const data = response.data;
        setFormData(data);
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    console.log(e)
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(formData)
      await axios.put(`http://localhost:8800/orders/update/${nameId}`, formData);
      console.log("Form data submitted successfully");
      navigate("/");
    } catch (error) {
      console.log(error);

    }
  };

  return (
    <div>
      <h1>Edit Order Status</h1>
      <h2>Order {formData.idorders} in {formData.factory} has: </h2>
      <h2>{formData.job_complete} completed job out of {formData.job_planned}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="job_complete">Jobs completed (number):</label>
          <input
            type="number"
            id="job_complete"
            name="job_complete"
            value={formData.job_complete}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="job_planned">Job Planned (number):</label>
          <input
            type="number"
            id="job_planned"
            name="job_planned"
            value={formData.job_planned}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="order_status">Order Status:</label>
          <select value={formData.order_status} id = "order_status" name = "order_status" onChange={handleChange}>
         
            <option value="0">Not Complete</option>
          </select>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default EditLocation;