const StudentProfile = require("../models/studentProfile");

function create(data) {
    return StudentProfile.create(data);
}

function findByStudentId(studentId) {
    return StudentProfile.findOne({ studentId });
}

async function search(query) {
    const q = query.trim();

    // Search by exact student number
    if (/^\d+$/.test(q)) {
        const student = await StudentProfile.findOne({
            studentId: `Student ${q}`
        }).lean();

        return student ? [student] : [];
    }

    // Search by full student id
    if (/^Student\s+\d+$/i.test(q)) {
        const student = await StudentProfile.findOne({
            studentId: q
        }).lean();

        return student ? [student] : [];
    }

    // Otherwise search names
    return StudentProfile.find({
        name: new RegExp(q, "i")
    })
    .limit(20)
    .lean();
}

module.exports = {
    create,
    findByStudentId,
    search
};