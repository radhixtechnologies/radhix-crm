import React from "react";

export default function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      className={`px-4 py-1 rounded-full text-sm font-medium transition-colors
        ${selected
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
      `}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
