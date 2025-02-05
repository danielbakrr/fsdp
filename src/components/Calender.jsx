// src/components/Calendar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Edit, Trash2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./calenderApp.jsx/dialog";
import { Button } from "./calenderApp.jsx/button";
import { Input } from "./calenderApp.jsx/input";
import '../styles/calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    time: ''
  });
  const navigate = useNavigate();

  // Calendar navigation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  // CRUD Operations
  const addEvent = () => {
    if (!selectedDate) return;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const newEvents = {
      ...events,
      [dateKey]: [
        ...(events[dateKey] || []),
        {
          id: Date.now(),
          ...eventForm
        }
      ]
    };
    
    setEvents(newEvents);
    closeDialog();
  };

  const updateEvent = () => {
    if (!editingEvent || !selectedDate) return;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    const updatedEvents = {
      ...events,
      [dateKey]: events[dateKey].map(event => 
        event.id === editingEvent.id ? { ...event, ...eventForm } : event
      )
    };
    
    setEvents(updatedEvents);
    closeDialog();
  };

  const deleteEvent = (dateKey, eventId) => {
    const updatedEvents = {
      ...events,
      [dateKey]: events[dateKey].filter(event => event.id !== eventId)
    };
    
    if (updatedEvents[dateKey].length === 0) {
      delete updatedEvents[dateKey];
    }
    
    setEvents(updatedEvents);
  };

  // Dialog handlers
  const openDialog = (date, event = null) => {
    setSelectedDate(date);
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description,
        time: event.time
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        time: ''
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedDate(null);
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      time: ''
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const days = [];
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = events[dateKey] || [];

      days.push(
        <div key={day} className="calendar-day">
          <div className="day-header">
            <span className="day-number">{day}</span>
            <button
              onClick={() => navigate("/calendar/campaign-scheduler")}
              className="add-event-btn"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="events-container">
            {dayEvents.map(event => (
              <div key={event.id} className="event-item">
                <span className="event-title">{event.title}</span>
                <div className="event-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDialog(date, event);
                    }}
                    className="edit-btn"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(dateKey, event.id);
                    }}
                    className="delete-btn"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 className="calendar-title">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="calendar-nav">
          <Button onClick={prevMonth} className="nav-btn">
            Previous
          </Button>
          <Button onClick={nextMonth} className="nav-btn">
            Next
          </Button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="days-grid">
          {renderCalendar()}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="dialog-form">
            <Input
              placeholder="Event Title"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            />
            <Input
              type="time"
              value={eventForm.time}
              onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
            />
            <div className="dialog-actions">
              <Button variant="outline" onClick={closeDialog}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingEvent) {
                    updateEvent();
                  } else {
                    addEvent();
                  }
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                {editingEvent ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;