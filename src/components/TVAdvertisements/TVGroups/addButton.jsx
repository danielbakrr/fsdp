import React from "react";
import styled from "styled-components";

const AddButton = ({onClick, label}) => {
  return (
    <StyledWrapper>
      <button className="noselect" onClick = {onClick}>
        <span className="text">{label}</span>
        <span className="icon">
          <svg
            viewBox="0 0 24 24"
            height={24}
            width={24}
            xmlns="http://www.w3.org/2000/svg"
          />
          <span className="buttonSpan">+</span>
        </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  button {
    width: 140px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    background: #00a600;
    border: none;
    border-radius: 5px;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.15);
    background: #00a600;
  }

  button,
  button span {
    transition: 200ms;
  }

  button .text {
    position: absolute;
    font-size: 18px;
    transform: translateX(25px);
    color: white;
    font-weight: bold;
  }

  button .icon {
    position: absolute;
    border-left: 1px solid #007300;
    transform: translateX(88px);
    height: 30px;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  button svg {
    width: 15px;
    fill: #eee;
  }

  button:hover {
    background: #00cc00;
  }

  button:active {
    background: #00cc00;
  }

  button:hover .text {
    color: transparent;
  }

  button:hover .icon {
    width: 120px;
    transform: translateX(0);
    border-left: none;
  }

  button:focus {
    outline: none;
  }

  button:active .icon svg {
    transform: scale(0.8);
  }

 .buttonSpan {
    color: white;
    margin: 150px;
    font-size: 30px;
  }`;

export default AddButton;
