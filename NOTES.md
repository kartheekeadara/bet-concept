# Brazilian Eats & Treats — concept notes

Sales mockup for Marcia Sanabria (16049 Johnston Rd Ste K, Charlotte NC 28277). Same stack as toa-concept:
Next.js 15 + Tailwind 3, static export, GitHub Pages at `/bet-concept` via `npm run deploy:pages`.

## Mobbin takeaways

| Section | Reference | What we took |
|---|---|---|
| Hero | [Savor hero](https://mobbin.com/sites/sections/3310e934-d36d-44a4-b4b7-65297ca0924b) | Full-bleed photo, big serif headline, small floating preorder card pinned bottom-right (thumbnail + one line + dark button). The card stays visible as a persistent nudge. We keep it on the hero only, and on mobile the sticky bottom bar does the same job. |
| Must-tries | [Graza trio](https://mobbin.com/sites/sections/e1617357-c934-4edb-a549-dde7bf356c30), [sweetgreen menu cards](https://mobbin.com/sites/sections/ef00c77c-841c-4e12-b207-df44ce97a57a) | Square photos with equal weight, name in caps or display type, 2-line description, one action. We add pronunciation under the name. |
| Menu | [Monte menu](https://mobbin.com/sites/sections/9cea9d4c-5557-44cf-97e4-41d7d086df12), [Corgi menu board](https://mobbin.com/sites/sections/9df7bc10-f0b2-4ad1-99b1-2dbab807ab6b) | Purely typographic: bold uppercase name, small description underneath, price right-aligned on the same baseline. Single brand color on cream. Columns on desktop; no cards. |
| Menu tabs | Panera category tabs, Keeta list rows | Horizontally scrollable pill tabs that stick under the header. On mobile: a list row with name/description on the left and the price plus an optional 64px thumbnail on the right. |
| Size picker | HelloFresh (box size control), [Swiggy guests + date](https://mobbin.com/screens/86daf600-7c2a-4ba0-9cde-7e70be2f8fcf) | Large segmented cards, each with a big number and the servings underneath. The selected state is a filled border, not just color. |
| Stepper + summary | [Tripadvisor checkout](https://mobbin.com/screens/0f26eac1-8dff-4077-9eac-864f5ced9434), [Contra pay panel](https://mobbin.com/screens/0546e0af-c710-4491-baee-86c01a7b91c1), Klook, GetYourGuide | The left column shows one numbered step at a time. A right panel sticks with a thumbnail, the choices so far, a "Change" link and the total. A trust line sits near the pay button. |
| Review | [Stripe review & submit](https://mobbin.com/screens/d8b29b26-595c-487b-af8c-04b9762468ef) | Each section is a bordered box with an "Edit" button top-right that jumps back to that step. |
| Pickup time | [DoorDash delivery time](https://mobbin.com/screens/3fb33a7e-063e-4478-bf91-e81b0603c60d), Wonder, Panera | Date chosen first, then a short list of radio time slots. A disabled primary button until a slot is picked. We use a month calendar (lead times are 5–14 days, so a horizontal day strip is too short) and then time chips. |
| Catering | Blue Apron split form, [Corgi host form](https://mobbin.com/sites/sections/b484d4dd-f9bc-4f42-a140-d6fafbd4390b), [Robot.com form](https://mobbin.com/sites/sections/bbd978e8-e1c8-4dfd-8351-819b2df5f342) | Two-column fields on desktop with labels above. Chip toggles for multi-choice (trays). One full-width submit. Contact info sits beside the form so phone people can just call. |
| Founder | [KÖPPEN note](https://mobbin.com/sites/sections/81d6349f-9811-4b17-9b2d-327dbabfa4fa), [incident.io note](https://mobbin.com/sites/sections/67e11461-af20-4b7e-8e9a-8f0cdc669a8d) | Short first-person paragraphs, the signature as the last line, and a large portrait opposite. |
| Loyalty | [Honest Greens stamp card](https://mobbin.com/screens/6dc61bf0-a764-450e-857c-502d99dd769c) | A 2×5 stamp grid with the last circle as a gift icon, a couple of stamps filled to show the idea, and a "1/10" counter. |

## Decisions
- Palette: cream `#FBF4EA` background, chocolate `#3E2318` text and dark sections, pink `#C8336E` as the single accent. White on pink is 5.05:1 and brown on cream is 13.2:1. On brown sections the accent switches to light pink `#F4A6C2` (7.6:1).
- Type: Fraunces (warm, soft display serif) for headings and Nunito Sans for body. Both cover Portuguese diacritics.
- The logo hasn't been supplied yet, so the header uses a typographic wordmark. If `public/photos/real/logo.png` exists, it is used instead.
- Photos: `lib/photos.ts` checks `public/photos/real/` at build time. A missing photo renders a dashed neutral block that says which photo is needed. No AI imagery anywhere.
- Menu descriptions are always English (per brief), under the Portuguese name, in both languages.
- Açaí moved into its own tab (it's listed under Doces on the paper menu).
- All swappable business data lives in `data/site.json`. The menu lives in `data/menu.json`, and UI copy in `data/i18n.ts`.

## Round 3 research (2026-11-21)

| Section | Reference | What we took |
|---|---|---|
| Language toggle | [Uber header](https://mobbin.com/screens/41010925-7d11-426c-92e8-5a7edf929087), [Amazon language menu](https://mobbin.com/screens/fb53cc4c-f068-43c8-924f-e330fa566531), [Duolingo](https://mobbin.com/screens/39d0954e-37c2-4c6b-958b-0ee6f14b7831) | "EN \| PT" read as two links with no clear state. Now a globe pill shows the current language (Uber); the menu lists each language in its own name with a check on the active one (Amazon). The mobile drawer shows English / Português as a two-option segmented control. |
| Must-tries | [Huey bestsellers](https://mobbin.com/sites/sections/07378d8d-cb1d-4c47-8dad-4facc3339586), [Faire](https://mobbin.com/sites/sections/9842bc7f-62e4-4d69-8cb3-07bbd149a335), [Busy Bee best sellers](https://mobbin.com/sites/sections/6be73b33-2f79-4115-a4fa-607046b3e641), sweetgreen | Numbered cards (01–04), big 4:5 photos with the price as a chip on the photo, no card chrome, and a "See the full menu" link. On phones it's a swipeable row that peeks the next card instead of tiny thumbnails. |
| Catering | [Whereby plans](https://mobbin.com/screens/e0dfe554-6bce-45eb-b91a-e225e0c66877), [Fiverr packages](https://mobbin.com/screens/9778a14a-465a-4354-b751-fcb847d0f28d), [OpenTable](https://mobbin.com/sites/sections/f289e722-625e-49bc-bf35-d935cfd479f3) | Intro copy plus a "what's in it" checklist next to the real photo, then three package cards (name, size, guests served, price, one action). "Choose this tray" pre-selects the tray in the request form and scrolls to it. |

Gotcha: the header's `backdrop-filter` makes it the containing block for `position: fixed` children, so the mobile drawer must be portaled to `<body>`.
