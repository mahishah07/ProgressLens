const { google } = require("@googleapis/sheets");
const Student = require("../models/Student");
const Assessment = require("../models/Assessment");

const BAND_ORDER = ["A1", "A2", "A3", "B4", "B5", "B6", "C7", "C8", "C9"];
const getBandIndex = (band) => BAND_ORDER.indexOf(band);

let pollingInterval = null;

const parseDate = (val) => {
	if (!val || String(val).trim() === "") return null;
	const str = String(val).trim();

	const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (ddmmyyyy) {
		const d = new Date(
			`${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`,
		);
		return isNaN(d.getTime()) ? null : d;
	}

	const d = new Date(str);
	return isNaN(d.getTime()) ? null : d;
};

const parseNum = (val) => {
	if (val === null || val === undefined || String(val).trim() === "")
		return null;
	const n = Number(val);
	return isNaN(n) ? null : n;
};

const parseBool = (val) => String(val).trim().toUpperCase() === "TRUE";

const getAuthClient = () => {
	const auth = new google.auth.GoogleAuth({
		credentials: {
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
		},
		scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
	});
	return auth;
};

const getSheetRows = async () => {
	const auth = getAuthClient();
	const sheets = google.sheets({ version: "v4", auth });

	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: process.env.GOOGLE_SHEET_ID,
		range: "Sheet1",
	});

	return response.data.values || [];
};

const mapHeaders = (headerRow) => {
	const map = {};
	headerRow.forEach((h, i) => {
		map[h.trim()] = i;
	});
	return map;
};

// UC7: manual/scheduled sync from Google Sheets
exports.syncFromSheets = async () => {
	const rows = await getSheetRows();

	if (rows.length < 2) {
		return { created: 0, skipped: 0, errors: [] };
	}

	const headerMap = mapHeaders(rows[0]);
	const dataRows = rows.slice(1);

	let created = 0;
	let skipped = 0;
	const errors = [];

	const get = (row, col) => row[headerMap[col]] ?? "";

	for (const row of dataRows) {
		const studentIdRaw = get(row, "Student_ID")?.trim();
		const semesterRaw = get(row, "Semester")?.trim();

		if (!studentIdRaw || !semesterRaw) {
			skipped++;
			continue;
		}

		const student = await Student.findOne({ studentId: studentIdRaw });
		if (!student) {
			skipped++;
			errors.push(`Student not found: ${studentIdRaw}`);
			continue;
		}

		const duplicate = await Assessment.findOne({
			student: student._id,
			semester: semesterRaw,
		});
		if (duplicate) {
			skipped++;
			continue;
		}

		const assessmentDate =
			parseDate(get(row, "PN_Date")) ||
			parseDate(get(row, "Phonics_Date")) ||
			parseDate(get(row, "WRA_Date")) ||
			parseDate(get(row, "NW_Date")) ||
			parseDate(get(row, "RD_Date")) ||
			new Date();

		const newAssessment = {
			student: student._id,
			semester: semesterRaw,
			summaryBand: get(row, "SummaryBand")?.trim() || null,
			newBand: get(row, "NewBand")?.trim() || null,
			pictureNamingScore: parseNum(get(row, "Picture_Naming")),
			pictureNamingProgress: parseBool(get(row, "PN_Progress")),
			pictureDescriptionScore: parseNum(get(row, "Picture_Description")),
			pictureDescriptionProgress: parseBool(get(row, "PD_Progress")),
			paIdentificationScore: parseNum(get(row, "PA_Identification")),
			paIdentificationProgress: parseBool(get(row, "PI_Progress")),
			phonicsScore: parseNum(get(row, "Phonics")),
			phonicsProgress: parseBool(get(row, "Phonics_Progress")),
			wraScore: parseNum(get(row, "Word_Reading_Accuracy")),
			wraProgress: parseBool(get(row, "WRA_Progress")),
			fluencyMark: parseNum(get(row, "FluencyMark")),
			fluencyProgress: parseBool(get(row, "Progress1")),
			wordSpellingScore: parseNum(get(row, "Word_Spelling")),
			wordSpellingProgress: parseBool(get(row, "WS_Progress")),
			letterFormationScore: parseNum(get(row, "Letter_Formation")),
			letterFormationProgress: parseBool(get(row, "LF_Progress")),
			ed1Score: parseNum(get(row, "Edit_D1")),
			ed1Progress: parseBool(get(row, "ED1_Progress")),
			ed2Score: parseNum(get(row, "Edit_D2")),
			ed2Progress: parseBool(get(row, "ED2_Progress")),
			ed3Score: parseNum(get(row, "Edit_D3")),
			ed3Progress: parseBool(get(row, "ED3_Progress")),
			narrativeScore: parseNum(get(row, "Narrative_Writing")),
			narrativeProgress: parseBool(get(row, "NW_Progress")),
			expositionScore: parseNum(get(row, "Exposition_Writing")),
			expositionProgress: parseBool(get(row, "EW_Progress")),
			persuasiveScore: parseNum(get(row, "Persuasive_Writing")),
			persuasiveProgress: parseBool(get(row, "PW_Progress")),
			lsComprehensionScore: parseNum(get(row, "LS_Comprehension")),
			lsComprehensionProgress: parseBool(get(row, "LS_Progress")),
			rdComprehensionScore: parseNum(get(row, "RD_Comprehension")),
			rdComprehensionProgress: parseBool(get(row, "RD_Progress")),
			assessmentDate,
			term: semesterRaw,
			assessedBy: get(row, "Teacher_ID")?.trim() || null,
		};

		await Assessment.create(newAssessment);
		created++;

		const newBand = newAssessment.newBand;
		if (newBand && getBandIndex(newBand) > getBandIndex(student.summaryBand)) {
			await Student.findByIdAndUpdate(student._id, { summaryBand: newBand });
		}
	}

	return { created, skipped, errors };
};

// Polling lifecycle
exports.startPolling = (intervalMinutes = 30) => {
	if (pollingInterval) return;
	pollingInterval = setInterval(
		async () => {
			try {
				const result = await exports.syncFromSheets();
				console.log(
					`Sheets sync: ${result.created} created, ${result.skipped} skipped`,
				);
			} catch (err) {
				console.error("Sheets sync failed:", err.message);
			}
		},
		intervalMinutes * 60 * 1000,
	);
	console.log(
		`Google Sheets sync polling started — every ${intervalMinutes} minute(s)`,
	);
};

exports.stopPolling = () => {
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
	}
};
