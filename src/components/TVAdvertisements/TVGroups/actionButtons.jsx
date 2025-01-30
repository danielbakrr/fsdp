import React from 'react';
import styled from 'styled-components';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa'; // Import icons from react-icons

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Button = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #f7efff;
  color: #000;
  cursor: pointer;
  outline: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  &:hover {
    background-color: #e0d4ff;
    transform: translateY(-2px);
  }

  svg {
    width: 21px;
    height: 21px;
    transition: transform 0.2s ease;
  }

  span {
    display: inline-block;
    opacity: 1;
    transition: opacity 0.2s ease;
  }
`;

const ActionsButton = ({ onView, onUpdate, onDelete }) => {
  return (
    <ButtonWrapper>
      <Button onClick={onView} className="view">
        <FaEye style={{ color: '#06B6D4' }} /> {/* View icon with blue color */}
        <span>View</span>
      </Button>

      <Button onClick={onUpdate} className="update">
        <FaEdit style={{ color: '#60A5FA' }} /> {/* Update icon with light blue color */}
        <span>Update</span>
      </Button>

      <Button onClick={onDelete} className="delete">
        <FaTrash style={{ color: '#FB923C' }} /> {/* Delete icon with orange color */}
        <span>Delete</span>
      </Button>
    </ButtonWrapper>
  );
};

export default ActionsButton;
