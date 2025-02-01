import React from 'react';
import { FaSync } from 'react-icons/fa'; // Correct icon import
import styled from "styled-components";

const UpdateAll = () => {
    return (
        <StyledWrapper>
            <ul className="update-all-button">
                <li className="icon-content">
                    <div className="update">
                        <FaSync /> 
                    </div>
                    <div className="text">Update All</div>
                </li>
            </ul>
        </StyledWrapper>
    );
};

const StyledWrapper = styled.div`
    .update-all-button {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        margin: 0;
        cursor: pointer;
    }

    .icon-content {
        margin: 0 10px;
        position: relative;
    }

    .update {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 85px;
        height: 40px; 
        border-radius: 10%;
        color: rgba(213, 205, 240, 0.87);
        font-size: 25px; 
        transition: color 0.3s ease-in-out;
        background-color: white;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    }

    /* Fix hover effect */
    .update-all-button:hover .update {
        color: rgb(179, 139, 255); 
    }

    .text {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #000;
        color: #fff;
        padding: 6px 15px;
        border-radius: 5px;
        opacity: 0;
        visibility: hidden;
        font-size: 14px;
        transition: all 0.3s ease;
        white-space: nowrap;     
    }

    .update-all-button:hover .icon-content .text {
        opacity: 1;
        visibility: visible;
        top: -50px;
    }
`;

export default UpdateAll;
