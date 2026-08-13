describe("EPA complete happy-path E2E", () => {
  it("uploads a writing sample, analyses it, and displays the EPA result", () => {
    const studentId = Cypress.env("epaStudentId");

    expect(studentId).to.exist;
    expect(studentId).not.to.equal("CHANGE_ME");

    cy.intercept(
      "POST",
      "**/api/uploads/writing-sample"
    ).as("uploadWritingSample");

    cy.intercept(
      "POST",
      "**/api/reports/*/analyze"
    ).as("analyzeReport");

    cy.intercept(
      "GET",
      "**/api/reports/*"
    ).as("getReport");

    cy.visit(
      `/error-dashboard/${encodeURIComponent(studentId)}`
    );

    cy.contains(
      studentId,
      {
        timeout: 20000,
      }
    ).should("be.visible");

    cy.get(
      '[data-cy="epa-file-input"]'
    )
      .should("exist")
      .selectFile(
        "cypress/fixtures/epa-valid-writing.pdf",
        {
          force: true,
        }
      );

    cy.contains(
      "epa-valid-writing.pdf"
    ).should("be.visible");

    cy.get(
      '[data-cy="epa-analyse-button"]'
    )
      .should("be.visible")
      .and("not.be.disabled")
      .click();

    cy.get(
      '[data-cy="epa-analyse-button"]'
    ).should(
      "contain.text",
      "Processing"
    );

    cy.wait(
      "@uploadWritingSample",
      {
        timeout: 180000,
      }
    ).then((interception) => {
      expect(
        interception.response.statusCode
      ).to.be.oneOf([
        200,
        201,
      ]);

      expect(
        interception.response.body
      ).to.exist;

      expect(
        interception.response.body.data
          .report._id
      ).to.exist;
    });

    cy.wait(
      "@analyzeReport",
      {
        timeout: 180000,
      }
    ).then((interception) => {
      expect(
        interception.response.statusCode
      ).to.eq(200);

      expect(
        interception.response.body
      ).to.exist;
    });

    cy.url({
      timeout: 180000,
    }).should(
      "include",
      "/student-errors/"
    );

    cy.wait(
      "@getReport",
      {
        timeout: 180000,
      }
    ).then((interception) => {
      expect(
        interception.response.statusCode
      ).to.eq(200);
    });

    cy.get(
      '[data-cy="student-error-page"]',
      {
        timeout: 30000,
      }
    ).should("be.visible");

    cy.get(
      '[data-cy="writing-sample"]'
    )
      .should("be.visible")
      .and("not.be.empty");

    cy.get(
      '[data-cy="error-chart"]'
    )
      .should("be.visible")
      .within(() => {
        cy.contains(
          "Error Type Classification"
        ).should("be.visible");
      });

    cy.get(
      '[data-cy="ai-pattern-analysis"]'
    )
      .should("be.visible")
      .within(() => {
        cy.contains(
          "AI Pattern Analysis"
        ).should("be.visible");

        cy.contains(
          "SUGGESTED INTERVENTIONS"
        ).should("be.visible");
      });
  });
});