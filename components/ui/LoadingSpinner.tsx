import React, { memo } from "react";

interface LoadingSpinnerProps {
  size?: number | "sm" | "md" | "lg";
  className?: string;
  color?: string;
}

const LoadingSpinner = memo(({ 
  size = "md", 
  className = "",
  color = "text-primary" 
}: LoadingSpinnerProps) => {
  // Handle size values
  let sizeClass = "";
  
  if (typeof size === "number") {
    sizeClass = `h-[${size}px] w-[${size}px]`;
  } else {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    };
    sizeClass = sizeClasses[size];
  }
  
  // Inline style for precise control when using numeric sizes
  const svgStyle = typeof size === "number" 
    ? { height: `${size}px`, width: `${size}px` } 
    : undefined;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${color} ${sizeClass}`}
        style={svgStyle}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
