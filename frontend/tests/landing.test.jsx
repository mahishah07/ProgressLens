import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Landing from "../src/pages/Landing";

function renderPage() {
	return render(
		<MemoryRouter>
			<Landing />
		</MemoryRouter>,
	);
}

function response(data, ok = true, status = 200) {
	return {
		ok,
		status,
		json: async () => data,
	};
}

function setupSuccessfulFetch() {
	const students = [
		{
			_id: "student-1",
			studentId: "DAS-001",
			centreId: "Bedok",
			name: "Student One",
		},
		{
			_id: "student-2",
			studentId: "DAS-002",
			centreId: "Bishan",
			name: "Student Two",
		},
	];

	const centres = ["Bedok", "Bishan"];

	const fetchMock = vi.fn(async (url) => {
		const parsedUrl = new URL(String(url), "http://localhost");

		const pathname = parsedUrl.pathname.toLowerCase();

		if (pathname.includes("/centres")) {
			return response(centres);
		}

		let filteredStudents = [...students];

		const search =
			parsedUrl.searchParams.get("q") ||
			parsedUrl.searchParams.get("search") ||
			parsedUrl.searchParams.get("studentId") ||
			"";

		const centre = parsedUrl.searchParams.get("centre") || "";

		if (search.trim()) {
			filteredStudents = filteredStudents.filter((student) =>
				student.studentId.toLowerCase().includes(search.trim().toLowerCase()),
			);
		}

		if (centre.trim()) {
			filteredStudents = filteredStudents.filter(
				(student) => student.centreId === centre,
			);
		}

		return response(filteredStudents);
	});

	vi.stubGlobal("fetch", fetchMock);

	return fetchMock;
}

describe("Landing page", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	test("renders the class overview", async () => {
		setupSuccessfulFetch();

		renderPage();

		expect(
			screen.getByRole("heading", {
				name: "Class Overview",
			}),
		).toBeInTheDocument();

		expect(
			screen.getByText(
				/Monitoring student progress and intervention risk levels/i,
			),
		).toBeInTheDocument();

		await screen.findByText("DAS-001");
	});

	test("renders the student search control", async () => {
		setupSuccessfulFetch();

		renderPage();

		expect(
			screen.getByPlaceholderText("Search by Student ID..."),
		).toBeInTheDocument();

		await screen.findByText("DAS-001");
	});

	test("renders the centre filter", async () => {
		setupSuccessfulFetch();

		renderPage();

		const select = screen.getByRole("combobox");

		expect(select).toBeInTheDocument();

		expect(
			screen.getByRole("option", {
				name: "Filter by: All Centres",
			}),
		).toBeInTheDocument();

		expect(
			await screen.findByRole("option", {
				name: "Bedok",
			}),
		).toBeInTheDocument();

		expect(
			screen.getByRole("option", {
				name: "Bishan",
			}),
		).toBeInTheDocument();
	});

	test("renders the register new student card", async () => {
		setupSuccessfulFetch();

		renderPage();

		await screen.findByText("DAS-001");

		expect(screen.getByText("Register New Student")).toBeInTheDocument();
	});

	test("renders the student dashboard link", async () => {
		setupSuccessfulFetch();

		renderPage();

		const links = await screen.findAllByRole("link", {
			name: /View Dashboard/i,
		});

		const [link] = links;

		expect(link).toBeInTheDocument();

		expect(link).toHaveAttribute("href", "/student/student-1");
	});

	test("renders students returned by the API", async () => {
		setupSuccessfulFetch();

		renderPage();

		expect(await screen.findByText("DAS-001")).toBeInTheDocument();

		expect(screen.getByText("DAS-002")).toBeInTheDocument();
	});

	test("allows teacher to enter a student ID in the search box", async () => {
		setupSuccessfulFetch();

		const user = userEvent.setup();

		renderPage();

		await screen.findByText("DAS-001");

		const search = screen.getByPlaceholderText("Search by Student ID...");

		await user.type(search, "DAS-001");

		expect(search).toHaveValue("001");
	});

	test("allows teacher to select a centre filter", async () => {
		setupSuccessfulFetch();

		const user = userEvent.setup();

		renderPage();

		await screen.findByRole("option", {
			name: "Bedok",
		});

		const select = screen.getByRole("combobox");

		await user.selectOptions(select, "Bedok");

		expect(select).toHaveValue("Bedok");
	});

	test("handles empty student data without crashing", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url) => {
				const value = String(url).toLowerCase();

				if (value.includes("centre")) {
					return response([]);
				}

				return response([]);
			}),
		);

		renderPage();

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "Class Overview",
				}),
			).toBeInTheDocument();
		});

		expect(screen.queryByText("DAS-001")).not.toBeInTheDocument();
	});

	test("handles API failure without crashing", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async (url) => {
				const value = String(url).toLowerCase();

				if (value.includes("centre")) {
					return response([]);
				}

				throw new Error("Unable to load students");
			}),
		);

		renderPage();

		expect(
			await screen.findByText(/Failed to load students/i),
		).toBeInTheDocument();
	});
});
