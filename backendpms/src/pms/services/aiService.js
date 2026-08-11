const OpenAI = require("openai");

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const SKILL_LABELS = {
	pictureNaming: "Picture Naming",
	pictureDescription: "Picture Description",
	paIdentification: "Phonological Awareness",
	phonics: "Phonics",
	wra: "Word Reading Accuracy",
	fluency: "Reading Fluency",
	wordSpelling: "Word Spelling",
	letterFormation: "Letter Formation",
	ed1: "Editing Skills (Level 1)",
	ed2: "Editing Skills (Level 2)",
	ed3: "Editing Skills (Level 3)",
	narrative: "Narrative Writing",
	exposition: "Exposition Writing",
	persuasive: "Persuasive Writing",
	lsComprehension: "Listening Comprehension",
	rdComprehension: "Reading Comprehension",
};

const sanitiseForAI = (comparison) => {
	const componentComparison = {};
	if (comparison.componentComparison) {
		for (const [key, val] of Object.entries(comparison.componentComparison)) {
			componentComparison[SKILL_LABELS[key] || key] = {
				before: val.before,
				after: val.after,
				change: val.change,
				beforePassed: val.beforePassed,
				afterPassed: val.afterPassed,
				bothTaken: val.bothTaken,
			};
		}
	}

	return {
		totalAssessments: comparison.totalAssessments,
		comparisonPeriod: comparison.comparisonPeriod,
		bandChange: comparison.bandChange,
		componentComparison,
		transitions: comparison.transitions,
	};
};

// UC6: generate AI teaching recommendations
exports.generateRecommendations = async (comparisonData) => {
	const sanitised = sanitiseForAI(comparisonData);

	const prompt = `You are an experienced special education teacher specialising in literacy development for students with dyslexia and learning differences.

Based on the following anonymised student assessment data, generate personalised teaching recommendations.

Assessment Data:
${JSON.stringify(sanitised, null, 2)}

Respond in the following JSON format only, no extra text, and in parent-friendly language:
{
  "summary": "2-3 sentence summary of the student's overall learning progress",
  "strengths": "2-3 sentences identifying what the student is doing well",
  "interventionAreas": "2-3 sentences identifying specific areas that need targeted support",
  "teachingStrategies": "3-4 concrete teaching strategies the teacher can use immediately",
  "suggestedActivities": "3-4 specific learning activities tailored to this student's needs"
}`;

	const response = await client.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [{ role: "user", content: prompt }],
		max_tokens: 1000,
		temperature: 0.7,
	});

	const text = response.choices[0].message.content.trim();
	const clean = text.replace(/```json|```/g, "").trim();
	return JSON.parse(clean);
};

// UC3: generate parent-friendly report using AI
// Note: dashboardData is already sanitised by reportService before being passed here
exports.generateParentReport = async (dashboardData, currentBand) => {
	const prompt = `You are a caring and empathetic special education teacher writing a progress report for a parent.

The report must be warm, encouraging, easy to understand, and completely free of technical jargon. 
The student is currently at band level ${currentBand || "unknown"} in their literacy development.

Assessment Data:
${JSON.stringify(dashboardData, null, 2)}

Respond in the following JSON format only, no extra text:
{
  "overallProgress": "2-3 warm, encouraging sentences summarising the child's overall progress in parent-friendly language",
  "literacyGrowth": "2-3 sentences highlighting specific areas where the child has grown, using simple language",
  "teacherObservations": "2-3 sentences with warm personal observations about the child's effort and attitude",
  "interventionAreas": "2-3 sentences explaining areas of focus in a positive, supportive way, with suggestions for home support"
}`;

	const response = await client.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [{ role: "user", content: prompt }],
		max_tokens: 1000,
		temperature: 0.7,
	});

	const text = response.choices[0].message.content.trim();
	const clean = text.replace(/```json|```/g, "").trim();
	return JSON.parse(clean);
};
