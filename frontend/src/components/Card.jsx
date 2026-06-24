import React from 'react';

const Card = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`${
        hoverEffect ? 'card-panel-interactive' : 'card-panel'
      } p-6 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
