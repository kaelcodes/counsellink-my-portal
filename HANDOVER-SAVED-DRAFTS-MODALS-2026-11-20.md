# Handover — Saved Drafts Modal UI
**Date:** 2026-11-20  
**Target:** `main` (implemented directly, as requested)  
**Feature:** Move Saved Drafts from inline table to modal table; individual view/edit dialogs.

## Implemented
- Replaced the inline Saved Drafts table with a compact Saved Drafts heading/count and **View drafts** button.
- The button opens a wide modal table listing Concern, Preferred Date, Time, Status, and Actions.
- Each draft row has:
  - **View**: closes the list modal and opens a read-only details modal.
  - **Edit**: closes the list modal and opens the existing Edit Draft form.
  - **Delete**: retains the existing confirmation/delete behavior and refreshes the list.
- Details modal shows concern, preferred date/time, status, and notes, with an Edit Draft action.
- Edit form continues to use the existing `openDraft()`, availability refresh, draft persistence, session date/time restoration, and submit workflow.
- Dialogs are opened sequentially; the list is closed before details or edit opens. No modal stacking is intended.
- List modal uses a wider dialog; details modal uses a smaller width. Responsive layout styles added.

## Files changed
- `src/app/guidance/appointment-history/appointment-history.component.html`
- `src/app/guidance/appointment-history/appointment-history.component.ts`
- `src/app/guidance/appointment-history/appointment-history.component.scss`

## Commits on main
- `43cd37c695f495d5d1c53eaf094c5f4ecafed2c5` — move saved drafts table into modal with details view
- `d3cc8b5de492a06738f0ff748c11e050df71a8b1` — add saved draft list and detail dialog flow
- `393346e42a7f046f3e9c765041a463eab2b824e5` — simplify draft modal action signatures (HTML)
- `23637a3377618c84937fbb00814103527d1a1ec8` — simplify draft modal action signatures (TypeScript)
- `dc5503151aedef6c963527f768492816fad48650` — style modal list and details
- `7e124a50eea6bb2a2db90a21480df3cef0cd74ac` — dialog widths
- `3ef9ea9f9b65beacb3085600026fa091410d3762` — fix details dialog style selector

## Validation status
- Remote code edits completed.
- **Angular build and browser testing have not been run from this workspace.**
- Pull locally and run `npm run build`; then test the flows below.

## Local smoke-test checklist
1. `git pull origin main`
2. `npm run build`
3. Saved Drafts section displays a View drafts button and count; the inline table is gone.
4. View drafts opens a table modal; test with 1 and multiple drafts.
5. View opens details, and closing details returns to the page (not a stacked list modal).
6. Edit from the list opens the existing Edit Draft form; changes save and refresh the draft data.
7. Edit from details opens the same form.
8. Verify date restoration, availability refresh, selecting a slot, save draft, and submit draft.
9. Delete draft and verify it disappears from the modal list and count updates.
10. Check narrow/mobile viewport.

## Rollback
This is a UI-only feature with existing draft API/form logic retained. If it causes problems, revert the feature commits on main (in reverse chronological order) or restore the three changed files from the pre-feature commit. Avoid resetting main or force-pushing. Prefer `git revert` to preserve history. Because the feature spans several commits, revert the listed commits in reverse order, starting with `3ef9ea9`, then `7e124a5`, `dc55031`, `23637a3`, `393346e`, `d3cc8b5`, and `43cd37c`, if all remain on the current history and no dependent edits have been added.
