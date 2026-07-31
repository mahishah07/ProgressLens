const WritingSample = require("../models/writingSample");

function create(data) { return WritingSample.create(data); }
function markAnalysed(id) { return WritingSample.findByIdAndUpdate(id, { status: "analysed" }, { new: true }); }

module.exports = { create, markAnalysed };
