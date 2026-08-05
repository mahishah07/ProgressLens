const AnswerKey = require("../models/answerKey");

function create(data) { return AnswerKey.create(data); }
function findById(id) { return AnswerKey.findById(id).lean(); }
function findFileById(id) { return AnswerKey.findById(id).select("originalName mimeType fileSize +fileData"); }

module.exports = { create, findById, findFileById };
