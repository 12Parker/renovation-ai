# Next-Level Product Roadmap

## 1) Contractor Matching + Estimate Linking (high impact)

### User value
- Turns planning into execution by helping users hire trusted pros.
- Reduces decision fatigue by showing 2-3 recommended contractors per trade.
- Keeps the budget grounded by mapping each estimate line item to real local availability.

### Proposed experience
1. User completes room analysis and sees recommended tasks.
2. App auto-detects required trades from `contractorTasks` and cost categories (e.g., carpenter, plumber, electrician, interior designer).
3. User enters postal code (or allows location).
4. For each trade, app shows 2-3 options with:
   - Name + rating + review count
   - Distance/service area
   - Typical hourly rate or project minimum
   - Earliest availability window
   - License/insurance verification status
   - "Why this match" explanation (based on project type + budget tier)
5. User can attach tasks to a contractor and export a shareable scope packet.

### Data model additions
- `ContractorProfile`: id, name, trades[], serviceAreas, rating, reviewCount, verification, contact channels.
- `ContractorQuoteHint`: contractorId, trade, expectedRangeLow, expectedRangeHigh, leadTimeDays.
- `EstimateAssignment`: costLineItemCategory -> contractorId(s) -> status.

### Matching logic (MVP)
- Input signals: room type, selected goals, `contractorTasks`, budget tier, postal code.
- Rule-based scoring first:
  - +trade match
  - +service area overlap
  - +budget fit
  - +minimum rating threshold
  - +availability fit
- Return top 2-3 per trade.

### Integrations
- Start with mocked contractor dataset for deterministic UX.
- Add external sources later (marketplaces/directories/licensing APIs).

### Safety and trust
- Display "informational only" disclaimer.
- Mark licensing status and verification timestamp.
- Never present unverified contact info as certified.

## 2) Scope-of-Work Generator (high impact)
- Convert analysis + selected tasks into a contractor-ready brief:
  - Project summary
  - Room photos
  - Desired finishes/materials
  - Must-have vs nice-to-have
  - Target budget range and schedule
- Export as PDF/email text for outreach.

## 3) Quote Comparison Workspace
- Let users upload incoming contractor quotes.
- Normalize to line items and compare apples-to-apples:
  - price variance
  - missing scope flags
  - allowance differences
  - timeline differences

## 4) Permit + Code Guidance Layer
- Given location + project scope, flag likely permit requirements.
- Show "ask your contractor" checklist (electrical panel changes, plumbing relocations, structural work).
- Keep legal language conservative and reference local building office resources.

## 5) Material Shopping Planner
- Map materials list to real products with alternatives by budget tier.
- Show quantity assumptions and substitution options.
- Save carts by project phase.

## 6) Phasing + Timeline Planner
- Build a suggested sequence (demo -> rough-in -> finishes).
- Include dependency constraints and expected duration ranges.
- Track what is DIY vs contractor-owned.

## 7) Financing + ROI Signals
- Scenario planning: cash vs financed monthly payment estimates.
- Value impact heuristics by room type (confidence bands, not guarantees).

## 8) Collaboration Features
- Invite partner/designer/contractor to comment on a project.
- Versioned decisions ("changed flooring from LVP to engineered wood").
- Shared decision log to reduce back-and-forth.

## 9) Learning Loop / Feedback
- Ask users post-project: actual spend, timeline, satisfaction.
- Use outcomes to calibrate future estimate ranges by region and room type.

## 10) Admin + Quality Controls
- Prompt/response quality audits for bad recommendations.
- Contractor recommendation quality metrics (click-through, contact rate, shortlists).
- Abuse/fraud guardrails for partner listings.

## Recommended build order
1. Contractor matching MVP (mock data, postal code + trade + 2-3 matches).
2. Scope packet export.
3. Quote comparison upload.
4. Permit/code checklist.
5. Real contractor/provider integrations.

## Success metrics
- % analyses that progress to contractor shortlist.
- % users exporting scope packet.
- Time from analysis to first contractor contact.
- Quote upload rate and conversion to booked project.
- Post-project satisfaction and budget accuracy delta.
