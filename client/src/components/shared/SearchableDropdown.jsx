import React, { useState, useRef, useEffect } from "react";

export default function SearchableDropdown({ options, selected, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-64">
      <button
        type="button"
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-left shadow-sm focus:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        {selected || placeholder}
      </button>
      {open && (
        <div
          ref={panelRef}
          className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <input
            className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
            placeholder="Search location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-4 py-2 text-gray-400">No results</div>
            )}
            {filtered.map(loc => (
              <button
                key={loc}
                className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                  selected === loc ? "bg-blue-100" : ""
                }`}
                onClick={() => {
                  onSelect(loc);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
