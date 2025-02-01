import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';
import './CampaignScheduler.css';

const CampaignScheduler = () => {
  const [formData, setFormData] = useState({
    campaignName: 'Ideation marketplace app',
    frequency: 'daily',
    color: '#2C87F2',
    date: '2024-04-17',
    startTime: '08:00',
    endTime: '09:00'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="scheduler-container">
      <div className="scheduler-modal">
        <div className="scheduler-content">
          {/* Header */}
          <div className="modal-header">
            <div className="header-title">
              <div className="header-icon">
                <Calendar size={20} />
              </div>
              <h2>Create Schedule</h2>
            </div>
            <button className="close-button">×</button>
          </div>

          <div className="subtitle">
            Fill in the data below to add a schedule
          </div>

          {/* Form Content */}
          <div className="form-content">
            {/* Frequency Selection */}
            <div className="frequency-section">
              <div className="frequency-container">
                <Select 
                  defaultValue="daily"
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger className="frequency-trigger">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <div className="color-picker-container">
                  <Input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="color-input"
                  />
                  <span className="percentage">100%</span>
                </div>
              </div>
            </div>

            {/* Campaign Name */}
            <div className="campaign-name-section">
              <label>Title Schedule</label>
              <Input
                name="campaignName"
                value={formData.campaignName}
                onChange={handleChange}
                className="campaign-input"
                placeholder="Enter campaign name"
              />
            </div>

            {/* Date & Time */}
            <div className="datetime-section">
              <label>Date & Time</label>
              <div className="datetime-container">
                {/* Date Input */}
                <div className="date-input-container">
                  <Calendar size={18} className="input-icon" />
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="date-input"
                  />
                </div>
                
                {/* Time Input */}
                <div className="time-inputs">
                  <div className="time-input-container">
                    <Clock size={18} className="input-icon" />
                    <Input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="time-input"
                    />
                  </div>
                  <span className="time-separator">-</span>
                  <div className="time-input-container">
                    <Clock size={18} className="input-icon" />
                    <Input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="time-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar" />

            {/* Buttons */}
            <div className="button-container">
              <Button variant="outline" className="cancel-button">
                Cancel
              </Button>
              <Button className="continue-button">
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignScheduler;