import React from "react";
import Chip from "../shared/Chip";
import StatusPill from "../shared/StatusPill";
import SearchableDropdown from "../shared/SearchableDropdown";

export default function JobPostingsFilters({
  departments,
  statuses,
  locations,
  selectedDepartments,
  setSelectedDepartments,
  selectedStatus,
  setSelectedStatus,
  selectedLocation,
  setSelectedLocation,
}) {
  return (
    <div className="flex flex-wrap gap-6 items-center bg-white p-6 rounded-xl shadow mb-6">
      {/* Departments */}
      <div>
        <div className="mb-2 text-sm font-semibold text-gray-700">Departments</div>
        <div className="flex flex-wrap gap-2">
          {departments.map(dep => (
            <Chip
              key={dep}
              label={dep}
              selected={selectedDepartments.includes(dep)}
              onClick={() => {
                setSelectedDepartments(prev =>
                  prev.includes(dep)
                    ? prev.filter(d => d !== dep)
                    : [...prev, dep]
                );
              }}
            />
          ))}
        </div>
      </div>
      {/* Statuses */}
      <div>
        <div className="mb-2 text-sm font-semibold text-gray-700">Status</div>
        <div className="flex gap-2">
          {statuses.map(status => (
            <StatusPill
              key={status}
              status={status}
              selected={selectedStatus === status}
              onClick={() => setSelectedStatus(status)}
            />
          ))}
        </div>
      </div>
      {/* Locations */}
      <div>
        <div className="mb-2 text-sm font-semibold text-gray-700">Location</div>
        <SearchableDropdown
          options={locations}
          selected={selectedLocation}
          onSelect={setSelectedLocation}
          placeholder="Select location"
        />
      </div>
    </div>
  );
}
