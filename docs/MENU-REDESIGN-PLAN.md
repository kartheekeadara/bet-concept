# Menu redesign plan (round 5)

Status: **built 2026-11-22** (§3 recommendation, one scrolling list). Placeholder photos for the 13 dishes without one are in (see §6). Not built yet: optional board view, dietary tags.

---

## 1. What changed since the round 4 "Vitrine" decision

Round 4 chose the typographic list plus a hover display case mostly because **only ~14 of 37 dishes had photos**. Thumbnails would have looked ragged, so photos were kept to one preview pane on desktop and an opt-in bottom sheet on phones.

**All 37 dishes now have an image** (24 real, 13 placeholders), which removes that limit. The current build also has problems the photos can't fix:

| Problem in the current `components/Menu.tsx` | Why it matters |
|---|---|
| On desktop the photo is hidden until you hover, and only one shows at a time. The list itself is text only. | Appetite appeal is the main job of a food menu, and the list doesn't do it. Touch laptops get nothing until a tap. |
| Clicking a tab **swaps** the category, so you can't scroll the whole menu. | People who want to browse have to click six times, and Ctrl-F only finds the open tab. Every delivery app on Mobbin scrolls one long list with tabs that **track** the scroll position. |
| `popular: true` is in the data but never shown. | It's the cheapest decision aid there is. DoorDash, Bolt and foodpanda all badge it. |
| Phone rows are tall (name, description, price all stacked) and the photo sits off to the side. | A 7-item category takes about 2.5 screens. |
| Category notes ("All lanches come with fries", lunch days) are small red text under a 52px heading. | Facts that affect price or availability get lost. |
| On desktop the right pane is 40% of the width and repeats what's in the row. | That space could show more dishes. |

---

## 2. Mobbin research

Searches: iOS restaurant menu with category tabs and photos, web restaurant menu pages, and web menu sections.

### Patterns worth taking

| Pattern | References | Take |
|---|---|---|
| **Sticky tabs that scroll-spy a single long list.** The active tab follows your scroll, and tapping a tab jumps to its section. | [Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f), [DoorDash iOS](https://mobbin.com/screens/f43b21e2-be10-492f-94a9-83b98c534b84), [Careem](https://mobbin.com/screens/79213b44-4e80-417c-925d-186f553bf6d8), [Bolt Food](https://mobbin.com/screens/7e5edd88-153d-4eec-9c1b-eb5bbfd229f8) | **Yes.** It's the convention everyone already knows (Jakob's Law). Ctrl-F works and browsing doesn't need clicks. |
| **Text left, square photo right** row: name, 2-line description, price, about 96–112px rounded thumbnail | Keeta, Careem, foodpanda, [Skip](https://mobbin.com/screens/46d71131-033b-49d2-8303-51cdbc851ba5) | **Yes on phones.** It's the densest layout that still shows the food. |
| **"Popular" pill** on the row | [Bolt Food](https://mobbin.com/screens/7e5edd88-153d-4eec-9c1b-eb5bbfd229f8), [foodpanda](https://mobbin.com/screens/e524490b-2480-4e6f-9923-6fd579a3cf1c), DoorDash web ("#1 most liked") | **Yes.** Use the price-tag motif instead of a generic yellow pill. |
| **Left sidebar category nav plus 2-column horizontal cards** on desktop | [Uber Eats web](https://mobbin.com/screens/fe5cf36d-fa39-41c2-9657-1060e1d8a921), [DoorDash web](https://mobbin.com/screens/eba10fc1-0c1d-46bf-a2dc-1efe7e5f72d2) | **Yes.** It shows 2× the dishes per screen, and the nav is always visible. |
| **Large photo cards with serif category words** as the switch | [sweetgreen section](https://mobbin.com/sites/sections/ef00c77c-841c-4e12-b207-df44ce97a57a), [sweetgreen menu](https://mobbin.com/screens/9d03a449-7ba8-45da-bc74-ef71e61440f8) | **Partly.** Use the big display-type category headings. Full-size cards for 37 items would be far too long. |
| **Featured horizontal strip** above the list | DoorDash web "Featured Items", [Glovo "Top sellers"](https://mobbin.com/screens/bbced264-b1c2-4f68-8507-059176797e60), [Honest Greens](https://mobbin.com/screens/a7f4e224-8217-4704-b7fe-6fa1e22941bc) | **No.** The `MustTry` section directly above the menu already does this. A second strip would duplicate it. |
| **Typographic board** with columns and leaders | [Monte](https://mobbin.com/sites/sections/9cea9d4c-5557-44cf-97e4-41d7d086df12), [Corgi](https://mobbin.com/sites/sections/9df7bc10-f0b2-4ad1-99b1-2dbab807ab6b) | **Only for the print / "chalkboard" view** (§5, optional). |
| **Dietary tags row** | [Wonder](https://mobbin.com/screens/280baaa4-f81a-41d2-9514-6b395003cff1) | **Later.** It needs real data (gluten-free pão de queijo is a real selling point). Don't invent it. |
| **Photo grid with names over the images** | [Google Maps menu](https://mobbin.com/screens/4ca8733a-3e76-4c74-8e39-29a2b3c3aaf9), [Burger King category index](https://mobbin.com/screens/52a2d6a8-799c-431c-a3a5-44dc0f736f90) | **No.** Text over photos hurts contrast and hides descriptions. |

### What to avoid
- Delivery-app chrome like "+" add buttons, quantity steppers and cart bars ([Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f), [Subway](https://mobbin.com/screens/a872fcd4-407a-4382-94ee-044fbdae8cc0)). This site doesn't take orders, and "+" buttons would promise a cart that doesn't exist. Ordering stays one Uber Eats link.
- Heavy shadows and cards inside cards (DoorDash). The site's look is flat cream, cocoa type and price tags.

---

## 3. Recommendation: "Balcão" menu (one scrolling list, photos in every row)

One long scrolling menu with sticky scroll-spy tabs. Every row shows its photo. The **price-tag motif** and **PT name + EN description** pairing stay as the brand signature.

### 3.1 Structure (all sizes)

```
[Header 68px]
[Sticky category bar: Salgados 8 · Sanduíches 5 · Lanches 7 · Pratos 4 · Doces 7 · Açaí 1]   ← scroll-spy
  ── Salgados ─────────────── (display serif, 40/52px)
     Note line (if any) as a cream callout with an icon, not red small text
     [row] [row] [row] …
  ── Sanduíches ──────────────
     …
```

- Sections are real `<section aria-labelledby>` blocks, and **tabs become in-page links** (`<nav>` + `aria-current="true"`), not an ARIA tablist, since there's nothing to hide anymore. That's a simpler and more honest ARIA pattern.
- Scroll-spy uses an `IntersectionObserver` (`rootMargin` ≈ `-140px 0px -60% 0px`). The active chip scrolls itself into view inside the bar.
- Tapping a chip calls `scrollIntoView` with `scroll-margin-top: 140px` on each section. `prefers-reduced-motion` turns smooth scroll off.
- Drop the `localStorage` "last tab" memory. It doesn't make sense with a scrolling page.

### 3.2 Phone row (≤ 639px)

```
┌──────────────────────────────────────────┐
│ Coxinha                 [Popular]  ┌────┐│
│ Shredded chicken in a crispy       │ 📷 ││  96×96, rounded-2xl
│ teardrop dough                     │    ││
│ [$4.00]                            └────┘│
└──────────────────────────────────────────┘
```
- Name 17px/800, description 15px with a 2-line clamp, price tag underneath. Same as now, but the thumbnail goes from 84 to **96px** and lines up with the text block's top.
- Remove the "expand" glyph on the thumbnail. The **whole row** opens the sheet, and a right-aligned photo is a familiar enough cue.
- The bottom sheet stays (it's good). Add the "Popular" tag and the category note inside it.
- Target: a 7-item category fits in about 1.6 screens (now about 2.5).

### 3.3 Tablet (640–1023px)
- The same rows in **2 columns**, with the photo on the left (112px) so each card reads as a unit.

### 3.4 Desktop (≥ 1024px)

```
┌────────────┬────────────────────────────────────────────────────┐
│ Salgados 8 │  Salgados                                          │
│ Sanduíches │  ┌──────────────────────┐ ┌──────────────────────┐  │
│ Lanches    │  │[img 128] Coxinha  ★  │ │[img] Coxinha Catupiry│  │
│ Pratos     │  │ desc…        [$4.00] │ │ desc…        [$4.50] │  │
│ Doces      │  └──────────────────────┘ └──────────────────────┘  │
│ Açaí       │  …                                                 │
│            │                                                    │
│ [Order     │                                                    │
│  pickup →] │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```
- A **sticky left rail** (≈200px) replaces the horizontal chip bar: category names in display type with counts, the active one marked with a brand-red bar (like Uber Eats). The "Order pickup" button sits at the bottom of the rail, so it stays visible the whole time.
- The content area is a **2-column grid of horizontal cards**: a 128px square photo on the left, then name, description and price. Hover lifts the photo slightly (`scale-[1.03]`, 200ms, turned off for reduced motion). Clicking opens a **centered dialog** version of the sheet with a 4:5 photo.
- **Retire the display-case pane.** Each card shows its own photo now, so it isn't needed. This is the main departure from round 4.
- The Pratos section gets a full-width **lead card** (feijoada photo, wider) because it's the highest-value plate and has the live `LunchStatus` pill.

### 3.5 Details that make it feel like this bakery's menu
- **Popular** = a small cocoa price-tag shape reading "Favorito" / "Popular" (bilingual through i18n), not a yellow pill.
- **Units** stay in the tag ("$1.75 each").
- **Feijoada**: the monthly date line stays, plus a link to the Feijoada band below.
- **Açaí** (1 item): show it as a single wide card with the topping list. A one-item grid looks broken.
- **Category notes** move into a cream callout with an icon (fries / calendar) right under each heading, at 15px/700 in cocoa (not red). Red stays for actions.

---

## 4. Implementation steps

1. **Data**: no schema change is needed. Optionally add `"note"` icons per category in `menu.json` (`"noteIcon": "fries" | "calendar"`).
2. **`components/Menu.tsx`**: rewrite around `MenuSection` → `MenuCard`. Keep `Price`, `Extra`, `LunchStatus` and `Sheet` (generalize `Sheet` into a responsive `DishDialog`: a bottom sheet under 1024px, centered above). Delete `Preview`, the tab key handler and `TAB_KEY`.
3. **Scroll-spy hook** `useScrollSpy(ids, offset)` in `lib/`.
4. **Nav**: `CategoryNav` with `variant="bar" | "rail"`, rendered twice and switched with responsive classes (`lg:hidden` / `hidden lg:block`).
5. **i18n**: add `menu.popular`, `menu.jump` (nav label). Remove `menu.cat.label` if it's no longer used.
6. **Images**: add `width`/`height` and `loading="lazy"` on all card images except the first category. Use `sizes` if we move to `next/image`.
7. **QA**: check at 390 / 768 / 1440. Keyboard: Tab through the nav, then the cards, Enter opens the dialog, Esc closes it, and focus returns. Check that the active state changes while scrolling. Verify contrast on the tags. Measure page height at 390px and expect it to *grow* (the full menu is now in the scroll), so confirm Cakes and Catering stay reachable through the header links and the mobile bar.

Estimated size: about 350 lines changed in `Menu.tsx`, plus a ~40-line hook and a few i18n keys.

---

## 5. Open questions / options

1. **Page length trade-off.** One long list adds about 3 phone screens compared with tabs. Mitigation: phone rows are tighter (§3.2), and the sticky bar is always there. If that's still too long, **option B** keeps the tab-swap but with the new photo rows. Pick before building.
2. **Optional "Ver como quadro" toggle**: a Monte-style typographic board view (no photos, two columns, dotted leaders) for people who just want prices. It's cheap to add later and isn't in v1.
3. **Dietary tags** (GF, V) need real answers from the bakery.
4. **Real photos**: 13 placeholders need replacing before anything goes public (see §6).

---

## 6. Placeholder photos (done)

- 13 stand-ins from **Wikimedia Commons** (free licenses, so they're safe to use in a mockup, unlike random Google Images results) in `public/photos/placeholder/menu/<id>.jpg`. Credits and licenses are in `public/photos/placeholder/CREDITS.md`.
- `lib/photos.ts` now loads placeholders first, and any `public/photos/real/menu/<id>.jpg` **overrides** one automatically. To replace a placeholder, drop the real photo in `real/menu/` and delete the placeholder.
- Weak matches to replace first: **bolinho-de-mandioca** (actually Ghanaian cassava fritters), **x-picanha** (an open steak baguette), **x-linguica** (a choripán), **misto-quente** (a cold ham sandwich, not pressed). Several CC BY / BY-SA images need attribution if shipped, so treat all of them as mockup-only.
