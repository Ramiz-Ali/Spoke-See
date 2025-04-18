import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <h1 className="text-4xl font-bold text-primary">
        <span>SPEAK</span>
        <span className="inline-flex items-center justify-center w-10 h-10 mx-2 rounded-full border-2 border-primary text-xl">&</span>
        <span>SEE</span>
        <span className="ml-2 text-base font-normal align-top text-primary/80">beta</span>
      </h1>
    </div>
  );
};

export default Logo;