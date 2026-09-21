const unavailable = (message) => async (req, res) => res.status(501).json({ success: false, message });
exports.getSalaryStructures = unavailable('Salary structures are not configured');
exports.getSalaryStructure = unavailable('Salary structures are not configured');
exports.getSalaryStructureByEmployee = unavailable('Salary structures are not configured');
exports.createSalaryStructure = unavailable('Salary structures are not configured');
exports.updateSalaryStructure = unavailable('Salary structures are not configured');
exports.deleteSalaryStructure = unavailable('Salary structures are not configured');