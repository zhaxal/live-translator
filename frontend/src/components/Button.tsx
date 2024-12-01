import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "purple" | "warning";
  ariaLabel?: string;
}

const Button = ({
  children,
  className,
  variant = "primary",
  ariaLabel,
  ...props
}: ButtonProps) => {
  let colorClass = "";
  if (variant === "primary") {
    colorClass = "bg-blue-500 hover:bg-blue-700";
  } else if (variant === "secondary") {
    colorClass = "bg-green-500 hover:bg-green-700";
  } else if (variant === "danger") {
    colorClass = "bg-red-500 hover:bg-red-700";
  } else if (variant === "purple") {
    colorClass = "bg-purple-500 hover:bg-purple-700";
  } else if (variant === "warning") {
    colorClass = "bg-yellow-500 hover:bg-yellow-700";
  }

  return (
    <button
      className={`${colorClass} text-white font-bold py-2 px-4 rounded ${className}`}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
