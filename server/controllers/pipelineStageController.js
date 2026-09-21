const PipelineStage = require('../models/PipelineStage');

const sendError = (res, error) => {
  res.status(error.statusCode || 500).json({ success: false, message: error.message });
};

const getStages = async (req, res) => {
  try {
    const query = req.query.includeInactive === 'true' ? {} : { isActive: true };
    const stages = await PipelineStage.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: stages });
  } catch (error) {
    sendError(res, error);
  }
};

const createStage = async (req, res) => {
  try {
    const stage = await PipelineStage.create({
      ...req.body,
      key: req.body.key || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
    res.status(201).json({ success: true, data: stage });
  } catch (error) {
    sendError(res, error);
  }
};

const updateStage = async (req, res) => {
  try {
    const stage = await PipelineStage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!stage) return res.status(404).json({ success: false, message: 'Pipeline stage not found' });
    res.json({ success: true, data: stage });
  } catch (error) {
    sendError(res, error);
  }
};

const deleteStage = async (req, res) => {
  try {
    const stage = await PipelineStage.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!stage) return res.status(404).json({ success: false, message: 'Pipeline stage not found' });
    res.json({ success: true, data: stage });
  } catch (error) {
    sendError(res, error);
  }
};

const reorderStages = async (req, res) => {
  try {
    const stages = Array.isArray(req.body.stages) ? req.body.stages : [];
    await Promise.all(stages.map((stage, index) => PipelineStage.findByIdAndUpdate(stage._id || stage.id, { order: index })));
    const updatedStages = await PipelineStage.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: updatedStages });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = { getStages, createStage, updateStage, deleteStage, reorderStages };