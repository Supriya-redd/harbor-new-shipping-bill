# Harbor — Shipping Bill Form

A responsive shipping bill creation flow built with plain HTML, CSS, and JavaScript. It includes expanded exporter, country, Indian port, transport, and unit choices; editable goods rows; live declared value and per-unit quantity summaries; field validation; and browser-local draft create, reopen, update, and delete actions.

## Run locally

Serve the `web` folder with a local static server (the app uses native JavaScript modules):

```sh
python -m http.server 8000 --directory web
```

Then open http://localhost:8000.

## Project structure

```text
web/
├── index.html
├── styles.css
└── app/
    ├── main.js                         # Page startup and DOM event wiring
    ├── components/goodsItems.js        # Goods row creation and reading
    ├── domain/shippingBill.js          # Validation and value calculations
    └── services/shippingBillService.js # Async mock options and draft persistence
```

The service module is the integration boundary for replacing mock operations with HTTP APIs. It owns option data and draft storage; UI code does not import hardcoded option arrays. Drafts currently persist in this browser's local storage, so they can be reopened on this device after reloading. Clearing site data removes them. This demo does not submit bills to customs or share drafts across devices.

No package manager or new dependency is required. `web/` remains the static publish directory. Keep any repository-managed Git submodules and their paths/configuration intact when integrating this refactor; no submodule metadata was present in this checkout.

## AI Usage & Approach

> **Tools used:** [List AI assistants, editors, and other tools used.]  
> **Workflow:** [Describe how the starter was inspected, changes were made incrementally, and decisions were reviewed.]  
> **Validation:** [List the checks you actually ran and their results. Do not claim checks that were not run.]  
> **Domain assumptions:** [Describe assumptions in field relationships and validation; production customs rules and government submission are outside this demo.]
