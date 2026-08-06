require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Student = require("./src/pms/models/Student");
const Assessment = require("./src/pms/models/Assessment");

const parseDate = (val) => {
	if (!val || String(val).trim() === "") return null;
	const str = String(val).trim();

	// Handle DD/MM/YYYY format
	const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (ddmmyyyy) {
		const d = new Date(
			`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`,
		);
		return isNaN(d.getTime()) ? null : d;
	}

	// Handle M/D/YY format
	const d = new Date(str);
	return isNaN(d.getTime()) ? null : d;
};

const parseNum = (val) => {
	if (val === null || val === undefined || String(val).trim() === "")
		return null;
	const n = parseFloat(val);
	return isNaN(n) ? null : n;
};

const parseBool = (val) => {
	if (val === null || val === undefined || String(val).trim() === "")
		return null;
	if (typeof val === "boolean") return val;
	if (String(val).toUpperCase() === "TRUE") return true;
	if (String(val).toUpperCase() === "FALSE") return false;
	return null;
};

const readCSV = (filePath) =>
	new Promise((resolve, reject) => {
		const rows = [];
		fs.createReadStream(filePath)
			.pipe(
				csv({
					mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim(),
				}),
			)
			.on("data", (row) => rows.push(row))
			.on("end", () => resolve(rows))
			.on("error", reject);
	});

const run = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI_PMS);
		console.log("MongoDB connected");

		await Student.deleteMany({});
		await Assessment.deleteMany({});
		console.log("Cleared existing data");

		const rows = await readCSV(path.join(__dirname, "data.csv"));
		console.log(`Read ${rows.length} rows from CSV`);
		console.log("First row Semester:", rows[0]["Semester"]);

		// build unique students map (one doc per unique Student_ID)
		const studentMap = {};
		for (const row of rows) {
			const studentId = row["Student_ID"]?.trim();
			if (!studentId || studentMap[studentId]) continue;
			studentMap[studentId] = {
				studentId,
				centreId: row["Centre_ID"]?.trim() || "",
				teacherId: row["Teacher_ID"]?.trim() || "",
				schoolId: row["School_ID"]?.trim() || "",
				age: parseNum(row["Age"]),
				schLevel: row["SchLevel"]?.trim() || "",
				enrollmentDate: parseDate(row["EnrollmentDate"]),
				summaryBand: row["SummaryBand"]?.trim() || "",
				progress: parseBool(row["Progress"]) ? "Moved up" : "Same level",
			};
		}

		const studentDocs = Object.values(studentMap);
		const insertedStudents = await Student.insertMany(studentDocs, {
			ordered: false,
		});
		console.log(`Inserted ${insertedStudents.length} students`);

		// build studentId -> _id lookup
		const idMap = {};
		for (const s of insertedStudents) {
			idMap[s.studentId] = s._id;
		}

		// build ALL 22k assessment rows — no deduplication
		const assessments = [];

		for (const row of rows) {
			const studentId = row["Student_ID"]?.trim();
			const semester = row["Semester"]?.trim();
			if (!studentId || !semester) continue;

			const mongoId = idMap[studentId];
			if (!mongoId) continue;

			assessments.push({
				student: mongoId,
				semester,
				summaryBand: row["SummaryBand"]?.trim() || "",
				newBand: row["NewBand"]?.trim() || null,

				pictureNamingScore: parseNum(row["Picture_Naming"]),
				pictureNamingDate: parseDate(row["PN_Date"]),
				pictureNamingProgress: parseBool(row["PN_Progress"]),

				pictureDescriptionScore: parseNum(row["Picture_Description"]),
				pictureDescriptionDate: parseDate(row["PD_Date"]),
				pictureDescriptionProgress: parseBool(row["PD_Progress"]),

				paIdentificationScore: parseNum(row["PA_Identification"]),
				paIdentificationDate: parseDate(row["PI_Date"]),
				paIdentificationProgress: parseBool(row["PI_Progress"]),

				phonicsScore: parseNum(row["Phonics"]),
				phonicsDate: parseDate(row["Phonics_Date"]),
				phonicsProgress: parseBool(row["Phonics_Progress"]),

				wraScore: parseNum(row["Word_Reading_Accuracy"]),
				wraDate: parseDate(row["WRA_Date"]),
				wraProgress: parseBool(row["WRA_Progress"]),

				fluencyMark: parseNum(row["FluencyMark"]),
				fluencyProgress: parseBool(row["Progress1"]),

				wordSpellingScore: parseNum(row["Word_Spelling"]),
				wordSpellingDate: parseDate(row["WS_Date"]),
				wordSpellingProgress: parseBool(row["WS_Progress"]),

				letterFormationScore: parseNum(row["Letter_Formation"]),
				letterFormationDate: parseDate(row["LF_Date"]),
				letterFormationProgress: parseBool(row["LF_Progress"]),

				ed1Score: parseNum(row["Edit_D1"]),
				ed1Date: parseDate(row["ED1_Date"]),
				ed1Progress: parseBool(row["ED1_Progress"]),

				ed2Score: parseNum(row["Edit_D2"]),
				ed2Date: parseDate(row["ED2_Date"]),
				ed2Progress: parseBool(row["ED2_Progress"]),

				ed3Score: parseNum(row["Edit_D3"]),
				ed3Date: parseDate(row["ED3_Date"]),
				ed3Progress: parseBool(row["ED3_Progress"]),

				narrativeScore: parseNum(row["Narrative_Writing"]),
				narrativeDate: parseDate(row["NW_Date"]),
				narrativeProgress: parseBool(row["NW_Progress"]),

				expositionScore: parseNum(row["Exposition_Writing"]),
				expositionDate: parseDate(row["EW_Date"]),
				expositionProgress: parseBool(row["EW_Progress"]),

				persuasiveScore: parseNum(row["Persuasive_Writing"]),
				persuasiveDate: parseDate(row["PW_Date"]),
				persuasiveProgress: parseBool(row["PW_Progress"]),

				lsComprehensionScore: parseNum(row["LS_Comprehension"]),
				lsComprehensionDate: parseDate(row["LS_Date"]),
				lsComprehensionProgress: parseBool(row["LS_Progress"]),

				rdComprehensionScore: parseNum(row["RD_Comprehension"]),
				rdComprehensionDate: parseDate(row["RD_Date"]),
				rdComprehensionProgress: parseBool(row["RD_Progress"]),

				monthsTo48: parseNum(row["No. of months to 48 months"]),

				assessmentDate:
					parseDate(row["PN_Date"]) ||
					parseDate(row["Phonics_Date"]) ||
					parseDate(row["WRA_Date"]) ||
					parseDate(row["NW_Date"]) ||
					parseDate(row["RD_Date"]) ||
					new Date(),
				term: semester,
				assessedBy: row["Teacher_ID"]?.trim() || null,
			});
		}

		console.log(`Assessments built: ${assessments.length}`);

		// bulk insert in batches of 1000
		const batchSize = 1000;
		let inserted = 0;
		for (let i = 0; i < assessments.length; i += batchSize) {
			const batch = assessments.slice(i, i + batchSize);
			await Assessment.insertMany(batch, { ordered: false });
			inserted += batch.length;
			console.log(`Inserted ${inserted}/${assessments.length} assessments...`);
		}

		console.log(
			`Done — ${insertedStudents.length} students, ${inserted} assessments`,
		);
		process.exit(0);
	} catch (err) {
		console.error("Seed failed:", err.message);
		process.exit(1);
	}
};

run();
