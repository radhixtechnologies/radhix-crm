const SalaryStructure = require('../../models/SalaryStructure');
const fail = (res, e) => res.status(500).json({ success: false, message: e.message });
const populateEmployee = { path: 'employee', populate: { path: 'user', select: 'name email' } };
exports.getSalaryStructures = async (req, res) => { try { res.json({ success: true, data: await SalaryStructure.find({ isActive: true }).populate(populateEmployee) }); } catch (e) { fail(res, e); } };
exports.getSalaryStructure = async (req, res) => { try { const structure = await SalaryStructure.findById(req.params.id).populate(populateEmployee); if (!structure) return res.status(404).json({ success: false, message: 'Salary structure not found' }); res.json({ success: true, data: structure }); } catch (e) { fail(res, e); } };
exports.getSalaryStructureByEmployee = async (req, res) => { try { res.json({ success: true, data: await SalaryStructure.findOne({ employee: req.params.employeeId, isActive: true }).sort({ effectiveFrom: -1 }) }); } catch (e) { fail(res, e); } };
exports.createSalaryStructure = async (req, res) => { try { const basic = Number(req.body.basic ?? req.body.basicSalary ?? 0); const allowances = Number(req.body.allowances || 0); const deductions = Number(req.body.deductions || 0); const grossSalary = basic + allowances; res.status(201).json({ success: true, data: await SalaryStructure.create({ ...req.body, basic, allowances, deductions, grossSalary, annualCTC: grossSalary * 12 }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateSalaryStructure = async (req, res) => {
	try {
		const structure = await SalaryStructure.findById(req.params.id);
		if (!structure) return res.status(404).json({ success: false, message: 'Salary structure not found' });

		const basic = Number(req.body.basic ?? req.body.basicSalary ?? structure.basic ?? 0);
		const allowances = Number(req.body.allowances ?? structure.allowances ?? 0);
		const deductions = Number(req.body.deductions ?? structure.deductions ?? 0);
		Object.assign(structure, req.body, {
			basic,
			allowances,
			deductions,
			grossSalary: basic + allowances,
			annualCTC: (basic + allowances) * 12,
		});
		await structure.save();
		res.json({ success: true, data: structure });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};
exports.deleteSalaryStructure = async (req, res) => { try { const structure = await SalaryStructure.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }); if (!structure) return res.status(404).json({ success: false, message: 'Salary structure not found' }); res.json({ success: true, data: structure }); } catch (e) { fail(res, e); } };