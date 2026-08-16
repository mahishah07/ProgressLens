# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## BERT intervention recommendation evaluation

Run the live semantic evaluation with:

```bash
npm run test:bert
```

The test sends one synthetic, spelling-dominant writing report through the production `analyseReportWithOpenAi` workflow. It then uses quantized `bert-base-uncased` to calculate token-level BERTScore precision, recall, and F1 for the generated intervention against educator reference recommendations. The reported `accuracy_f1` percentage is the semantic accuracy value used by this project. It also requires the result to beat an unrelated-reference baseline by at least two percentage points.

Requirements and behaviour:

- `OPENAI_API_KEY` must be configured in `backend/.env`.
- The first run downloads and caches the quantized BERT model; later runs reuse it.
- The default pass threshold is 60% BERTScore F1. Override it with `BERT_MIN_F1`, for example `BERT_MIN_F1=0.65 npm run test:bert` on macOS/Linux or `$env:BERT_MIN_F1='0.65'; npm run test:bert` in PowerShell.
- Normal `npm test` skips the live evaluation, so regular unit tests do not download a model or consume API credits.
- BERTScore measures semantic similarity to the supplied educator references. It is not a clinical accuracy score and does not replace educator review.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
