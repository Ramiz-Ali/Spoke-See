import React from 'react';

const StarryBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background-dark to-background-darker" />
    </div>
  );
};

export default StarryBackground;