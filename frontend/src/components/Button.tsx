import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

const Button = ({ children, className, variant = "primary", ...props }: ButtonProps) => {
  let colorClass = "";
  if (variant === "primary") {
    colorClass = "bg-blue-500 hover:bg-blue-700";
  } else if (variant === "secondary") {
    colorClass = "bg-green-500 hover:bg-green-700";
  } else if (variant === "danger") {
    colorClass = "bg-red-500 hover:bg-red-700";
  }

  return (
    <button
      className={`${colorClass} text-white font-bold py-2 px-4 rounded ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
