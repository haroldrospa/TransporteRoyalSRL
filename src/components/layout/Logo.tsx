
import React from 'react';

const Logo = () => {
  return (
    <div className="flex flex-col items-center gap-1">
      <img 
        alt="TransRoyal Logo" 
        src="/TransporteRoyalLogo.png"
        className="h-16 w-auto object-contain" 
        loading="eager"
        fetchpriority="high"
        decoding="sync"
      />
    </div>
  );
};

export default Logo;
