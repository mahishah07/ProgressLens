const sheetsSync = require("../services/sheetsSync");

// POST /api/sheets/sync — manual trigger
exports.manualSync = async (req, res) => {
	try {
		const results = await sheetsSync.syncFromSheets();
		res.json({
			status: "ok",
			message: "Sync complete",
			...results,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
