import React, { useState } from 'react';
import './ScheduleForm.css';
import { X, Calendar } from 'lucide-react';

const ScheduleForm = () => {
  const [formData, setFormData] = useState({
    frequency: 'daily',
    color: '#2C87F2',
    campaignName: 'Ideation marketplace app',
    date: 'Wed, April 17, 2024',
    startTime: '08:00',
    endTime: '09:00'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="schedule-form-container">
      <div className="schedule-form-modal">
        <div className="modal-header">
          <div className="header-left">
            <Calendar className="calendar-icon" />
            <h2>Create Schedule</h2>
          </div>
          <button className="close-button">
            <X size={20} />
          </button>
        </div>

        <p className="subtitle">Fill in the data below to add a schedule</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Campaign Frequency</label>
            <select 
              name="frequency" 
              value={formData.frequency}
              onChange={handleInputChange}
              className="select-input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="form-group">
            <div className="color-picker-container">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="color-picker"
              />
              <span className="percentage">100%</span>
            </div>
          </div>

          <div className="form-group">
            <label>Title Schedule</label>
            <input
              type="text"
              name="campaignName"
              value={formData.campaignName}
              onChange={handleInputChange}
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="text"
              value={formData.date}
              className="text-input date-input"
              readOnly
            />
            <div className="time-inputs">
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="time-input"
              />
              <span className="time-separator">-</span>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="time-input"
              />
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>

          <div className="button-group">
            <button type="button" className="cancel-button">Cancel</button>
            <button type="submit" className="continue-button">Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleForm;