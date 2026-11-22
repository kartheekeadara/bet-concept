# Brazilian Eats & Treats: Round 4 revision plan

Status: **plan only. No code has changed yet.** Written 2026-11-22 after auditing the live build at 1440px and 390px, reading every section's source, researching menu and visit patterns on Mobbin, reviewing the three UX-principle references, and pulling the bakery's own photos from brazilianeatsandtreats.com.

---

## 0. How this was reviewed

The site was critiqued as a seven-person agency panel. Each role did its own pass over the whole page. After that came a cross-pass where roles argued with each other, and a final red-team pass that asked whether anything would actually make someone say "wow".

| Role | Lens |
|---|---|
| Creative director | Is anything here something *only this bakery* could own? |
| UX lead | Visitor jobs, information architecture, scroll cost per task |
| Content strategist / UX writer | Every word: true, needed, in the right language? |
| Interaction & motion | Where one interaction earns delight, and where it adds friction |
| Accessibility specialist | WCAG 2.2 AA, keyboard and screen-reader paths, touch targets |
| Mobile & performance engineer | 390px reality, image weight, sticky-element stacking |
| Local-business strategist | Calls, directions, cake orders, catering leads |

Principles applied (from Framer, The Decision Lab and Figma): visual hierarchy, consistency, proximity, progressive disclosure, Jakob's Law (break a convention only for a clear reason), simplicity, feedback, error prevention, accessibility, performance.

---

## 1. Who visits, and why (the ranking that drives everything)

Most visitors land from Google Maps or search on a phone. In order:

1. **"Are they open? Where exactly?"** (highest frequency)
2. **"What do they have, and what does it cost?"** (menu)
3. **"Can I order a celebration cake?"** (highest revenue per visit)
4. **"Can they cater my party?"** (high-value lead)
5. **"Is this the real thing?"** (Brazilian expats and the curious checking authenticity)

**What the audit found against that ranking:**
- Job 1 isn't answered until the **last section**. The hero has no open/closed status, even though the strings `hours.openUntil` and `hours.opensOn` already exist and are unused.
- Job 2 is the **largest section by far**. On a phone the menu runs about 8 screens (the page is 14,415px tall at 390px). It pushes cakes (job 3) and catering (job 4) down to roughly screen 11 and screen 13.
- The Google rating (4.9 from 354 reviews) is in `site.json` but never shown. It's the strongest trust signal the bakery has.

---

## 2. Panel findings, pass by pass

### Pass 1: Creative director. "Why does this look like every AI-built site?"
These patterns mark the site as templated. Each one is fine alone; together they read as generic.
- **The same section opener eight times:** pink caps eyebrow, then serif H2, then grey intro line (Must-try, Menu, Cakes, Catering, Story, Feijoada, Visit). The eyebrow often just translates the heading ("Visit / Come by", "Bolos / Cakes for every celebration").
- **Same rhythm everywhere:** every section uses `py-16 sm:py-24` inside a 1200px column, so nothing breathes differently or interrupts.
- **Default kit:** pill buttons, `rounded-3xl` cards, numbered "01–04" chips, check-circle bullet lists, and "→" typed into button labels.
- **Generic palette:** cream, chocolate and hot pink could belong to any bakery.
- **The best brand asset is buried.** The store has a hand-painted red **"Bem-vindo!"** mural over a chocolate wave stripe, and a chalkboard wall that reads **"que bom que VOCÊ está aqui"**. The hero hides the mural under an overlay that's up to 96% brown. The chalkboard line doesn't appear anywhere.
- **An unused cohesive photo set:** the bakery's own site has a consistent studio series shot on white subway tile (mousse trio, brigadeiro swirl cake, torched-meringue fruit cake, coconut-chocolate cake, coxinha/kibe tray, a three-tier wedding cake, and a **real feijoada photo**). Shared lighting and backdrop make a set like this feel art-directed. None of it is used yet.

**Direction: "A vitrine."** In a Brazilian padaria you choose by walking along the glass case and pointing. The case, its little price tags, the mural and the chalkboard are the store's real visual language. The site should feel like walking in, not like a template. That gives exactly **two signature moments**, with everything else quiet:
1. The **"Bem-vindo" welcome**: the real mural shown in full color, with a live open/closed line.
2. The **Vitrine menu**: browsing the menu like looking into the display case (see Pass 3).

Plus one small recurring motif: **price tags** styled like the white case tags (tabular numerals on a tiny tag shape). They appear on menu prices, must-try cards and catering trays.

### Pass 2: UX lead. Information architecture

| Current order | Problem | Proposed order |
|---|---|---|
| Hero | No status or trust signal; heavy overlay | **Hero**: mural, *Sabor de casa.*, live status, rating |
| Must-try (4) | Good. User asked to remove the link | **Must-try (4)**, no link |
| Menu (~8 mobile screens) | Buries the revenue sections | **Menu (Vitrine)**: one category at a time, about 1.5 screens |
| Cakes | Good photos, no captions, no hero image | **Cakes**: wedding-cake lead image plus captioned grid |
| Catering (3 stacked blocks) | Tray cards duplicate the form chips | **Catering**: trays *are* the form's first field |
| Story | Dashed "Photo needed" box in a sales pitch | **Feijoada band** (real photo, next date, text signup) |
| Feijoada + Loyalty | Loyalty program is invented ("Coming soon") | **Story** (moved below; real photo or chalkboard wall) |
| Visit | Unbalanced columns; Instagram button | **Visit**: "Que bom que você está aqui." |
| Footer | Repeats the Visit section | **Footer**: slim; Instagram and Facebook live here only |

Cuts: **Loyalty card** (it promises a program the bakery hasn't announced), the **Instagram handle in Visit** (user request) and in the catering aside (for consistency), and **"Popular" tags in the menu** for the items already in Must-try (it's said twice).

### Pass 3: The menu (Mobbin research and recommendation)

Five layout families were researched:

| # | Pattern | References | Strengths | Fit here |
|---|---|---|---|---|
| A | **Typographic board**: columns of name, description, price | [Monte](https://mobbin.com/sites/sections/9cea9d4c-5557-44cf-97e4-41d7d086df12), [Corgi](https://mobbin.com/sites/sections/9df7bc10-f0b2-4ad1-99b1-2dbab807ab6b) | Fast to scan, classy | **Current approach.** Fine on desktop, endless on a phone, and it shows no food. |
| B | **Delivery-app list**: sticky tabs, rows with a thumbnail on the right | [Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f), [DoorDash](https://mobbin.com/screens/f43b21e2-be10-492f-94a9-83b98c534b84), [Bolt Food](https://mobbin.com/screens/7e5edd88-153d-4eec-9c1b-eb5bbfd229f8) | Familiar (Jakob's Law), mobile-native | Looks like Uber Eats. Only ~14 of 37 items have photos, so thumbnails are ragged (already visible in the build). |
| C | **Photo card grid with big category words** | [sweetgreen](https://mobbin.com/sites/sections/ef00c77c-841c-4e12-b207-df44ce97a57a), [re_](https://mobbin.com/sites/sections/e3791536-524c-4b4d-9f30-565dd1c279c1) | Strongest appetite appeal | Needs a photo for every item, and gets long. |
| D | **Index list with a large preview on hover** | [A24](https://mobbin.com/sites/sections/b645a881-adf5-43f3-a86c-758cd54f0b72), [Waka Waka](https://mobbin.com/sites/sections/fe089d5d-5adb-4849-a282-ae46d8fd7eac) | Distinctive; text stays scannable; one image at a time | Handles missing photos well (falls back to a category photo). Desktop only. |
| E | **Collapsed groups with "See N more"** | [DoorDash "See 4 more"](https://mobbin.com/screens/f43b21e2-be10-492f-94a9-83b98c534b84) | Controls length | Hides items behind clicks. Better as a fallback. |

**Recommendation: a hybrid "Vitrine menu" (D on desktop, B done properly on mobile, with A's typography).**

- **Category tabs switch the view instead of scrolling the page.** Only one category is shown at a time (Salgados, Sanduíches, Lanches, Pratos, Doces, Açaí). This is progressive disclosure: the menu drops from about 4 desktop screens and 8 mobile screens to roughly one each. Implemented as a proper ARIA `tablist` with arrow-key support.
- **Desktop (two panes):** left is the typographic list (PT name, EN description, price tag). Right is a sticky "display case" panel showing a large photo of the hovered or **focused** row, with its pronunciation and description. Items without a photo show that category's lead photo with the item name over it, so there are never empty boxes or ragged rows.
- **Mobile:** sticky category chips, then rows with a consistent left edge. Every row gets the same treatment: a photo where one exists, otherwise a small type-only price-tag block, so the column never jumps. **Tapping a row opens a bottom sheet** with the big photo, pronunciation and description (focus-trapped, closes on swipe or Esc).
- **Live availability:** "Pratos" shows "Served today until 3 PM" or "Back Tuesday" from the existing hours logic. Feijoada shows the next date and links to the text signup.
- **Opening state:** Salgados, the category first-timers need. The tab choice is remembered in `localStorage` with try/catch.
- **Uber Eats CTA:** `uberEatsUrl` is currently a *search* URL, not the store page. Needs the real link (see §5). If there isn't one, change the CTA to "Call ahead for pickup".

### Pass 4: The "Come by" section (user request, plus panel)

Problems in the current build: the hours table on the left and the photo/address/buttons on the right don't balance (the left column ends about 170px early). The storefront photo is a **portrait 1500×2000 cropped to 16:9**, which cuts off the sign. A "HOURS" mini-label repeats the heading. Three buttons carry equal weight, and the Instagram button isn't a visit task.

Redesign (informed by [Little Amps](https://mobbin.com/sites/sections/74a3a0da-d93a-419b-a675-1a641b46a4eb), [Samara](https://mobbin.com/sites/sections/f53bcfb9-579b-43ad-8923-89e66973e8fe) and [Monte footer](https://mobbin.com/sites/sections/6ecba422-fe26-482b-8225-8e24ec959d84)):
- **Headline taken from their own wall: "Que bom que você está aqui."** with the English underneath ("We're so glad you're here."). That line is distinctive and true.
- **Left column, in task order:** (1) a large live status, "Open now · until 7 PM" or "Closed · opens Tue 8 AM"; (2) the address set in display type and linked to Maps; (3) **one row of actions: Get directions (primary) and Call (secondary)**; (4) a compact hours list with today highlighted. Instagram is removed.
- **Right column:** the storefront photo at its **native portrait ratio**, so the sign shows and the column height matches the content. On a phone the photo goes *below* the actions, because actions come first on mobile.
- Optional (needs a fact): a landmark or parking line, e.g. "In the Johnston Rd plaza, free parking out front."
- **Hours data conflict to fix:** `site.json` says Sunday 8:00–3:30 (marked sample), while the bakery's own site says **Sunday 8 AM–4 PM**, Tue–Sat 8–7. Confirm against Google and drop the `sample` flag.

### Pass 5: Hero (user request, plus panel)
- **Remove** "Coxinhas, pão de queijo and celebration cakes, made by a family from Curitiba." (EN and PT keys `hero.body`).
- After the removal, the hero is just H1 and subline. The panel's objection is that the first viewport answers none of the visitor jobs. Proposal, staying minimal to respect the earlier "simplify" round: one quiet line under the subline with the **live status · ★ 4.9 (354 Google reviews)**. No card and no extra buttons; the header and mobile bar already carry "Order a cake".
- **Lighten the overlay** so the mural's red reads as red: use a short bottom gradient only behind the text block, not a 96% wash. Re-crop so "Bem-vindo!" sits in the clear top area on both 1440 and 390 widths. Contrast must stay at least 4.5:1 behind the text; verify with computed pixels.

### Pass 6: Must-try
- **Remove "See the full menu"** (both the desktop inline link and the mobile full-width button) per request. The menu sits directly below, so the link was redundant (proximity).
- Swap the numbered "01–04" chips (a template tell) for the price-tag motif. The price moves onto a tag in the card corner.
- Pão de queijo shows no price ("Ask at the counter"). Get the price from Marcia; a must-try with no price looks unfinished.

### Pass 7: Cakes
- Lead with the **three-tier wedding cake** from their own site (the most impressive single photo), shown large, with the grid beside or below it.
- Add **visible captions** (flavor or occasion) under each tile. Right now labels appear only inside the lightbox, so the grid is anonymous.
- Pull in the studio set (brigadeiro swirl, torched-meringue fruit cake, coconut-chocolate) so the gallery has a consistent look.
- Remove the "→" typed into "Design your cake →". Use the icon component, consistent with the other buttons.

### Pass 8: Catering
- Merge **tray cards and form chips** into one control: the tray cards *are* the form's first step. One control, one source of truth (consistency, error prevention).
- Replace the portrait `catering.jpg`, which crops badly at 4:3, with the **coxinha/kibe tray studio shot** (`BET12`).
- **"SAMPLE" badges** on every price broadcast "fake". Show one footnote under the trays ("Sample prices for the concept") instead of three badges.
- Aside: keep phone and email; drop Instagram.

### Pass 9: Feijoada band (promoted) and Story (moved)
- **Feijoada** is a real monthly event with a real photo on their site. Make it a full-bleed dark band with the photo, "Next feijoada: Sat, Dec 13" (a sample date; confirm), and the existing text-signup form. It's the one recurring reason to come back.
- **Story:** the dashed "Photo needed" box can't ship in a sales mockup. Either (a) a photo of Marcia with permission, or (b) the **chalkboard wall photo** (`interior.jpg` area), which needs no permission. Also verify the copy: "came to Charlotte in 2007" and the surname "Sanabria" vs. the Facebook slug "marciajames2020". Invented biography is a credibility risk in a pitch.

### Pass 10: Accessibility, mobile and performance
- Menu tabs use the ARIA tablist pattern. The hover preview also responds to `:focus-visible`. The bottom sheet has a focus trap, restores focus on close, and closes on Esc.
- Sticky stack on mobile: 68px header plus the menu chips plus the 64px bottom bar. Check that at least 55% of an 844px screen stays visible for content, and hide the bottom bar while the menu sheet is open.
- **Images:** JPEGs up to 2000px are served to phones with no `srcset`. Add a `scripts/resize.mjs` (sharp) step that emits 480/960/1600 widths, plus `srcset`/`sizes` in `Photo`. This matters most for the hero (LCP).
- Keep `prefers-reduced-motion` handling for the hover-preview crossfade and the sheet animation.

### Pass 11: Content and microcopy
- Remove eyebrows that only translate their heading. Keep Portuguese as a *designed* element in exactly three places: the hero ("Sabor de casa."), the menu tabs (category names), and the Visit headline. Everywhere else, use plain English headings.
- Remove arrow characters typed into strings (`cakes.design`, `hero.card.cta`) and leave arrows to the icons.
- Every PT string changed gets its PT counterpart in the same commit (en/pt parity check).

### Pass 12: Red team. "Is this wow, or is it just more?"
- **Risk:** over-design. Hover panes and sheets on a site most people use for 20 seconds on a phone from Google Maps. **Guardrail:** each of the three core tasks (call, directions, order a cake) must stay at most **two taps from any scroll position** on mobile. Keep this as a test-plan checkbox.
- **Risk:** the palette change could make the cake section look less sweet. **Guardrail:** mural red becomes the brand and action color; pink stays only in the logo and the cake section (see decision D1).
- **What actually creates "wow" for a bakery customer:** the food looks delicious, the place feels real, and the menu is effortless. The plan puts its effort into photography, the vitrine menu and the mural. Decoration is not the lever.

---

## 3. Execution phases

| Phase | Scope | Depends on |
|---|---|---|
| **1. Requested edits** | Remove hero body line (EN/PT); remove "See the full menu" (desktop and mobile); remove Instagram from Visit | Nothing; can start now |
| **2. Assets and facts** | Pull Google Maps review photos and bakery-site studio shots into `public/photos/real/` (incl. feijoada, wedding cake, tray), resize pipeline, fix hours/Facebook URL in `site.json` | §5 answers |
| **3. Vitrine menu** | Tabs, desktop preview pane, mobile rows and bottom sheet, live Pratos availability, price-tag motif | Phase 2 photos |
| **4. Visit redesign** | Status-first layout, native-ratio storefront, "Que bom que você está aqui." | Phase 1 |
| **5. Brand layer** | Hero overlay and crop, mural-red token, eyebrow removal, rhythm changes, type decision | D1, D2 |
| **6. Section revisions** | Cakes lead image and captions; catering merge; feijoada band; story fix; cut loyalty; slim footer | Phase 2 |
| **7. Verification** | `scripts/shoot.mjs` at 390/1440 in EN/PT (no console errors, no horizontal scroll); keyboard-only run; contrast checks on hero and tags; Lighthouse mobile; full panel re-review pass with this document as the checklist | All |

---

## 4. Decisions for you

- **D1 Color:** move the action/brand accent from hot pink `#C8336E` to the **mural's red** (sampled from the hero photo, e.g. a brick or tomato red that passes AA on cream), with pink kept for the logo and cakes? *(Panel recommends yes; it's the store's real color.)*
- **D2 Type:** keep Fraunces + Nunito Sans (safe, but a very common pairing), or try a more characterful display face with a condensed face for price tags? *(Panel recommends a trial on the hero and menu before committing.)*
- **D3 Loyalty card:** cut it? *(Panel recommends cutting; it promises a program that doesn't exist.)*
- **D4 Hero status line:** add the one-line "Open now · ★ 4.9" under the subline, or keep the hero to headline and subline only?

## 5. What I need from you

1. **Google Maps photos:** OK for me to open the bakery's Google Maps listing in your Chrome and save the review/owner photos into the repo?
2. **Marcia:** a photo with permission (or confirm we use the chalkboard wall instead), her correct surname, and whether the story facts (Curitiba, 2007, opened Sept 2022) are hers.
3. **Real Uber Eats store link** (or confirm there's no online ordering).
4. **Pão de queijo and feijoada prices**, and the real next feijoada date.
5. **Facebook:** use `facebook.com/marciajames2020` (from their site) instead of the placeholder?
