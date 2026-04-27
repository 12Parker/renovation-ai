# Renovation AI

> An AI-powered home renovation planner that turns room photos into practical design suggestions, budget estimates, and visual transformation prompts.

## Problem
Most homeowners and renters can picture *that they want change*, but struggle to turn inspiration into a practical plan. They often need to answer:

- What should I change first in this room?
- What can I DIY vs hire out?
- What budget range makes sense?
- How do I describe my ideal design clearly enough for visualization tools?

Renovation AI bridges that gap by combining room-photo understanding with actionable renovation guidance.

## MVP Scope (Best First Version)
Upload image → choose style/goals → receive room analysis, renovation checklist, budget tiers, and an image-generation prompt.

### Core User Flow
1. Upload a room photo.
2. Select room type:
   - basement
   - bedroom
   - kitchen
   - laundry room
   - office
   - living room
3. Select style:
   - cozy modern
   - vintage
   - Tudor
   - Scandinavian
   - moody
   - minimalist
4. Add goals:
   - better lighting
   - flooring
   - storage
   - layout
   - paint
   - built-ins
5. Receive AI output:
   - Room summary
   - Renovation suggestions
   - Budget tiers (low / medium / high)
   - Materials list
   - DIY vs contractor tasks
   - Redesign prompt for image generation

## Product Milestones

### Milestone 1 — Static App Shell
Build a polished UI with:
- Landing page
- Upload card
- Room type dropdown
- Style dropdown
- Goals checklist
- Empty results panel

**Deliverable:** UI that looks production-ready before AI integration.

### Milestone 2 — Mock AI Results
Add hardcoded sample output for one uploaded image:
- Room summary
- Suggestions
- Budget table
- Shopping/materials checklist
- Generated redesign prompt

**Deliverable:** Demo-ready experience with realistic UX.

### Milestone 3 — Real AI Room Analysis
Integrate OpenAI for image + text analysis.

Input:
- Uploaded image
- Room type
- Style
- Goals

Output schema:

```ts
{
  roomSummary: string;
  priorities: string[];
  suggestions: RenovationSuggestion[];
  budget: {
    low: string;
    medium: string;
    high: string;
  };
  materials: string[];
  contractorTasks: string[];
  diyTasks: string[];
  imagePrompt: string;
}
```

**Deliverable:** Real photo in, practical renovation guidance out.

### Milestone 4 — Better Results UI
Improve readability with sections:
- What I noticed
- Biggest wins
- Budget options
- DIY weekend upgrades
- Contractor-level upgrades
- Image prompt

**Deliverable:** Portfolio-quality results presentation.

### Milestone 5 — Before/After Prompt Generator
Support copy/regenerate prompt workflows such as:

> Transform this unfinished basement into a cozy modern theatre room with warm recessed lighting, luxury vinyl plank flooring, acoustic wall panels, a sectional sofa, built-in media wall, and soft neutral colors.

**Deliverable:** Useful standalone prompt-generation value even without full image generation.

### Milestone 6 — Saved Projects
Add project persistence:
- Save room analysis
- Project title
- Notes
- Revisit prior projects

Storage path:
- localStorage first
- Supabase later

**Deliverable:** Product feels durable and reusable.

### Milestone 7 — Cost Estimator
Add line-item estimates:
- Flooring
- Paint
- Lighting
- Built-ins
- Plumbing
- Electrical
- Furniture
- Labour

**Deliverable:** Compare DIY refresh vs full renovation scenarios.

### Milestone 8 — Image Generation (Stretch)
Optional concept visualization flow:
1. Upload room photo
2. Generate redesign prompt
3. Send prompt/image to image model
4. Show original and concept side-by-side

**Deliverable:** High-impact “wow” transformation preview.

## Suggested Tech Stack
- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes
- **AI:** OpenAI vision + text generation APIs
- **Storage:** Local-first, migrate to Supabase
- **Auth:** Skip for MVP
- **Image generation:** Stretch feature after analysis quality is strong

## Architecture (Target)
- `app/` or `src/app/`: pages and route segments
- `components/`: upload form, selectors, result cards, budget table
- `lib/ai/`: prompt builders, API adapters, JSON schema validation
- `lib/models/`: TypeScript types for room analysis outputs
- `app/api/analyze-room/route.ts`: server endpoint for AI analysis
- `lib/storage/`: localStorage abstraction and future Supabase adapter

## AI Prompt Design
Prompting should enforce structure and practical recommendations:
- Include room type, desired style, and user-selected goals.
- Ask for safety-aware suggestions (electrical/plumbing flagged as contractor tasks).
- Require low/medium/high budget framing.
- Require concise materials list with rationale.
- Require clean image-prompt output designed for downstream generation models.
- Validate response against the JSON schema before rendering.

## Example Output (Condensed)

```json
{
  "roomSummary": "Unfinished basement with limited natural light and exposed utilities; strong potential for a cozy media room.",
  "priorities": ["lighting", "flooring", "layout"],
  "budget": {
    "low": "$2,000-$6,000",
    "medium": "$8,000-$18,000",
    "high": "$20,000-$45,000"
  },
  "materials": [
    "Luxury vinyl plank flooring",
    "Warm LED recessed lights",
    "Acoustic wall panels",
    "Moisture-resistant paint"
  ],
  "diyTasks": ["Paint walls", "Install shelving", "Assemble furniture"],
  "contractorTasks": ["Electrical panel updates", "New recessed lighting circuit"],
  "imagePrompt": "Transform this unfinished basement into a cozy modern theatre room..."
}
```

## Demo Screenshots
- Add screenshots after Milestone 1 and Milestone 4 to show UI progression.
- Recommended captures:
  - Upload/config form state
  - Mock results state
  - Final polished analysis layout

## Roadmap
1. UI shell
2. Mock results
3. OpenAI integration
4. Polished results UI
5. Prompt generator improvements
6. Saved projects
7. Cost estimator
8. Image generation stretch

## Lessons Learned (to update during build)
- Structured JSON outputs reduce fragile UI parsing.
- Clear distinction between DIY and contractor tasks improves user trust.
- Prompt quality significantly impacts practical usefulness.
- Budget transparency drives repeat engagement.

## Local Development (current)
```bash
npm install
npm run dev
```

### Environment Variables
Create `.env.local` with:
```bash
OPENAI_API_KEY=your_api_key
# Optional override
OPENAI_MODEL=gpt-4o-mini
```

Project now includes:
- Next.js App Router + TypeScript baseline
- Tailwind CSS configuration and global styles
- shadcn/ui-compatible setup (`components.json`, `cn` utility, base `Button` and `Card` components)
- Milestone 1 static shell and Milestone 2 mock AI results flow
- API mock route at `src/app/api/analyze-room/route.ts`
- Type models under `src/lib/models`
- Prompt builder and local storage helper modules

## License
MIT

## Post-Milestone Roadmap
- See `docs/next-level-roadmap.md` for proposed next-level features, including contractor matching tied to estimate line items.
