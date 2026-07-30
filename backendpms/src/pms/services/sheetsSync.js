const { google } = require("googleapis");
const path = require("path");
const Student = require("../models/Student");
const Assessment = require("../models/Assessment");

const SHEET_RANGE = "Assessments!A1:BH";

const parseDate = (val) => {
	if (!val || String(val).trim() === "") return null;
	const d = new Date(val);
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
	if (String(val).toUpperCase() === "TRUE") return true;
	if (String(val).toUpperCase() === "FALSE") return false;
	return null;
};

const getAuthClient = () => {
	const auth = new google.auth.GoogleAuth({
		keyFile: path.join(__dirname, "../../../google-credentials.json"),
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});
	return auth;
};

const getSheetRows = async () => {
	const auth = getAuthClient();
	const sheets = google.sheets({ version: "v4", auth });

	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: process.env.GOOGLE_SHEET_ID,
		range: SHEET_RANGE,
	});

	const rows = response.data.values;
	if (!rows || rows.length < 2) return [];

	const headers = rows[0];
	return rows.slice(1).map((row) => {
		const obj = {};
		headers.forEach((header, i) => {
			obj[header.trim()] = row[i] ?? "";
		});
		return obj;
	});
};

// UC7: main sync function
exports.syncFromSheets = async () => {
	const results = {
		created: 0,
		skipped: 0,
		errors: [],
	};

	let rows;
	try {
		rows = await getSheetRows();
	} catch (err) {
		throw new Error(`Google Sheets API unreachable: ${err.message}`);
	}

	for (const row of rows) {
		try {
			const studentId = row["Student_ID"]?.trim();

			const semester = row["Semester"]?.trim();

			if (!studentId || !semester) {
				results.skipped++;
				continue;
			}

			// validate student exists in DB
			const student = await Student.findOne({ studentId });
			if (!student) {
				results.errors.push(
					`Student ID ${studentId} not found in database — row skipped`,
				);
				results.skipped++;
				continue;
			}

			// check for duplicate
			const existing = await Assessment.findOne({
				student: student._id,
				semester,
			});
			if (existing) {
				results.skipped++;
				continue;
			}

			// create new assessment
			const newAssessment = await Assessment.create({
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

			// update student summaryBand if new band is higher
			if (row["NewBand"]?.trim()) {
				const BAND_ORDER = [
					"A1",
					"A2",
					"A3",
					"B4",
					"B5",
					"B6",
					"C7",
					"C8",
					"C9",
				];
				const currentIndex = BAND_ORDER.indexOf(student.summaryBand);
				const newIndex = BAND_ORDER.indexOf(row["NewBand"].trim());
				if (newIndex > currentIndex) {
					await Student.findByIdAndUpdate(student._id, {
						summaryBand: row["NewBand"].trim(),
						progress: "Moved up",
					});
				}
			}

			results.created++;
		} catch (err) {
			results.errors.push(`Row error for ${row["Student_ID"]}: ${err.message}`);
			results.skipped++;
		}
	}

	return results;
};

// polling service — runs every X minutes
exports.startPolling = (intervalMinutes = 30) => {
	const intervalMs = intervalMinutes * 60 * 1000;
	console.log(
		`Google Sheets sync polling started — every ${intervalMinutes} minutes`,
	);

	const sync = async () => {
		try {
			console.log("Sheets sync running...");
			const results = await exports.syncFromSheets();
			console.log(
				`Sheets sync complete — created: ${results.created}, skipped: ${results.skipped}, errors: ${results.errors.length}`,
			);
		} catch (err) {
			console.error("Sheets sync failed:", err.message);
		}
	};

	sync();
	setInterval(sync, intervalMs);
};
