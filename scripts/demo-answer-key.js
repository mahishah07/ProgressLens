const fs = require("fs");
const path = require("path");

const baseUrl = process.env.ERROR_ANALYSER_URL || "http://localhost:5002/api";
const sampleFolder = process.argv[2] || "/Users/lavanya/Downloads/Edit&Diagram 1";
const answerKeyPath = path.join(sampleFolder, "Edit&Diagram Answer.png");
const sampleNames = ["Student-121606.jpg", "Student-141683.jpg", "Student-153072.jpg"];

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${body.error || response.statusText}`);
  return body.data;
}

function fileForm(field, filePath, values = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.append(key, value);
  const mimeTypes = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".pdf": "application/pdf" };
  form.append(field, new Blob([fs.readFileSync(filePath)], { type: mimeTypes[path.extname(filePath).toLowerCase()] }), path.basename(filePath));
  return form;
}

async function ensureStudent(studentId) {
  const response = await fetch(`${baseUrl}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, name: `Student ${studentId}` }),
  });
  if (response.status !== 409 && !response.ok) {
    const body = await response.json();
    throw new Error(`${response.status} ${body.error || response.statusText}`);
  }
}

async function main() {
  const answerKey = await requestJson(`${baseUrl}/uploads/answer-key`, {
    method: "POST",
    body: fileForm("answerKey", answerKeyPath, { title: "Writing - Edit and Diagram 1" }),
  });

  const results = [];
  for (const sampleName of sampleNames) {
    const studentId = path.parse(sampleName).name.replace("Student-", "");
    await ensureStudent(studentId);
    const upload = await requestJson(`${baseUrl}/uploads/writing-sample`, {
      method: "POST",
      body: fileForm("assignment", path.join(sampleFolder, sampleName), {
        studentId,
        answerKeyId: answerKey._id,
      }),
    });
    const report = await requestJson(`${baseUrl}/reports/${upload.report._id}/analyse`, { method: "POST" });
    results.push({ studentId, writingSampleId: upload.writingSample._id, reportId: report._id, errorCounts: report.errorCounts });
  }

  process.stdout.write(`${JSON.stringify({ answerKeyId: answerKey._id, results }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
