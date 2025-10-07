import React from 'react';

interface XIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const XIcon: React.FC<XIconProps> = ({ 
  className = '', 
  size = 24,
  color = 'currentColor' 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 4l16 16m0-16L4 20" />
    </svg>
  );
};
