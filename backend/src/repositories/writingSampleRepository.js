const WritingSample = require("../models/writingSample");

function create(data) { return WritingSample.create(data); }
function markAnalysed(id, { expectedText, recommendedIntervention }, session = null) {
  return WritingSample.findByIdAndUpdate(
    id,
    { expectedText, recommendedIntervention, status: "analysed" },
    { new: true, runValidators: true, session }
  );
}

function findFileById(id) {
  return WritingSample.findById(id).select("originalName mimeType fileSize +fileData");
}

module.exports = { create, markAnalysed, findFileById };
