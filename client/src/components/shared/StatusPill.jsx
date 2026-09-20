import React from "react";

const statusStyles = {
  Published: {
    dot: "bg-green-500",
    pill: "bg-green-100 text-green-800",
    selected: "bg-green-700 text-white",
  },
  Draft: {
    dot: "bg-yellow-400",
    pill: "bg-yellow-100 text-yellow-800",
    selected: "bg-yellow-700 text-white",
  },
  Closed: {
    dot: "bg-red-500",
    pill: "bg-red-100 text-red-800",
    selected: "bg-red-700 text-white",
  },
};

export default function StatusPill({ status, selected, onClick }) {
  const style = statusStyles[status] || statusStyles.Published;
  return (
    <button
      type="button"
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors
        ${selected ? style.selected : style.pill}
      `}
      onClick={onClick}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      {status}
    </button>
  );
}
