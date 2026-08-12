const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Student = require("../models/Student");
const Assessment = require("../models/Assessment");
const Report = require("../models/Report");

let mongo;

async function connectTestDatabase() {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
	await Promise.all([
		Student.syncIndexes(),
		Assessment.syncIndexes(),
		Report.syncIndexes(),
	]);
}

async function clearTestDatabase() {
	await Promise.all([
		Student.deleteMany({}),
		Assessment.deleteMany({}),
		Report.deleteMany({}),
	]);
}

async function stopTestDatabase() {
	await mongoose.disconnect();
	if (mongo) await mongo.stop();
}

const studentPayload = (studentId = "DAS-0707", overrides = {}) => ({
	studentId,
	centreId: "CENTRE-A",
	teacherId: "teacher-01",
	schLevel: "Primary",
	summaryBand: "B4",
	progress: "Same level",
	...overrides,
});

const assessmentPayload = (student, semester, date, overrides = {}) => ({
	student,
	semester,
	assessmentDate: date,
	summaryBand: "B4",
	newBand: "B4",
	wraScore: 7,
	fluencyMark: 20,
	wordSpellingScore: 7,
	narrativeScore: 9,
	rdComprehensionScore: 6,
	...overrides,
});

// helper for a guaranteed-passing B4 assessment (useful for band progression tests)
const passingAssessmentPayload = (student, semester, date, overrides = {}) => ({
	student,
	semester,
	assessmentDate: date,
	summaryBand: "B4",
	wraScore: 9,
	fluencyMark: 20,
	wordSpellingScore: 9,
	narrativeScore: 15,
	rdComprehensionScore: 8,
	...overrides,
});

module.exports = {
	connectTestDatabase,
	clearTestDatabase,
	stopTestDatabase,
	studentPayload,
	assessmentPayload,
	passingAssessmentPayload,
	Student,
	Assessment,
	Report,
};
