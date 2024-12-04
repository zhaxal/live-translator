import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "purple" | "warning";
  ariaLabel?: string;
  fullWidth?: boolean;
}

const Button = ({
  children,
  className,
  variant = "primary",
  ariaLabel,
  fullWidth = false,
  ...props
}: ButtonProps) => {
  let colorClass = "";
  if (variant === "primary") {
    colorClass = "bg-blue-500 hover:bg-blue-700 active:bg-blue-800";
  } else if (variant === "secondary") {
    colorClass = "bg-green-500 hover:bg-green-700 active:bg-green-800";
  } else if (variant === "danger") {
    colorClass = "bg-red-500 hover:bg-red-700 active:bg-red-800";
  } else if (variant === "purple") {
    colorClass = "bg-purple-500 hover:bg-purple-700 active:bg-purple-800";
  } else if (variant === "warning") {
    colorClass = "bg-yellow-500 hover:bg-yellow-700 active:bg-yellow-800";
  }

  return (
    <button
      className={`
        ${colorClass}
        ${fullWidth ? 'w-full' : ''}
        text-white font-bold
        text-sm md:text-base
        py-3 md:py-2
        px-6 md:px-4
        rounded
        touch-manipulation
        min-h-[44px]
        break-words
        transition-colors
        ${className}
      `}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;