require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Student = require("./src/pms/models/Student");
const Assessment = require("./src/pms/models/Assessment");

const parseDate = (val) => {
	if (!val || val.trim() === "") return null;
	const d = new Date(val);
	return isNaN(d.getTime()) ? null : d;
};

const parseNum = (val) => {
	if (val === null || val === undefined || val === "") return null;
	const n = parseFloat(val);
	return isNaN(n) ? null : n;
};

const parseBool = (val) => {
	if (val === null || val === undefined || val === "") return null;
	if (typeof val === "boolean") return val;
	if (val.toString().toUpperCase() === "TRUE") return true;
	if (val.toString().toUpperCase() === "FALSE") return false;
	return null;
};

const run = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB connected");

		const rows = [];

		await new Promise((resolve, reject) => {
			fs.createReadStream(path.join(__dirname, "data.csv"))
				.pipe(csv())
				.on("data", (row) => rows.push(row))
				.on("end", resolve)
				.on("error", reject);
		});

		console.log(`Read ${rows.length} rows from CSV`);

		let studentsCreated = 0;
		let assessmentsCreated = 0;
		let skipped = 0;

		for (const row of rows) {
			const studentId = row["Student_ID"]?.trim();
			if (!studentId) {
				skipped++;
				continue;
			}

			// upsert student
			let student = await Student.findOne({ studentId });
			if (!student) {
				student = await Student.create({
					studentId,
					centreId: row["Centre_ID"]?.trim() || "",
					teacherId: row["Teacher_ID"]?.trim() || "",
					schoolId: row["School_ID"]?.trim() || "",
					age: parseNum(row["Age"]),
					schLevel: row["SchLevel"]?.trim() || "",
					enrollmentDate: parseDate(row["EnrollmentDate"]),
					summaryBand: row["SummaryBand"]?.trim() || null,
					progress: parseBool(row["Progress"]) ? "Moved up" : "Same level",
				});
				studentsCreated++;
			}

			// check for duplicate assessment (same student + semester)
			const semester = row["Semester"]?.trim();
			const existing = await Assessment.findOne({
				student: student._id,
				semester,
			});
			if (existing) {
				skipped++;
				continue;
			}

			await Assessment.create({
				student: student._id,
				semester,
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

				assessmentDate: parseDate(row["PN_Date"]) || new Date(),
				term: semester,
				assessedBy: row["Teacher_ID"]?.trim() || null,
			});

			assessmentsCreated++;
		}

		console.log(
			`Done — ${studentsCreated} students created, ${assessmentsCreated} assessments created, ${skipped} skipped`,
		);
		process.exit(0);
	} catch (err) {
		console.error("Seed failed:", err.message);
		process.exit(1);
	}
};

run();
