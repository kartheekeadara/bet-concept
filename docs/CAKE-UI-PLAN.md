# Cake ordering: revision plan

Status: **Phases 1–5 implemented 2026-11-22** (uncommitted at time of writing). Not done: real slice photos for the Inside swatches (illustrated for now), and the "Few slots left" hint was dropped on purpose (no real booking data = fake urgency). Written 2026-11-22 after walking all 7 steps plus the confirmation at 1440px and 390px, reading `components/cake/*`, and researching configurator and checkout patterns on Mobbin.

**North star:** ordering a cake should feel like sitting at the counter with Marcia, flipping through her cake book. Right now it feels like filling out a form. **The cake should be the hero of every screen, not the inputs.**

---

## 1. What's there today

A solid foundation: 7 steps (Occasion, Size, Flavor, Design, Pickup, Contact, Review), a sticky summary on desktop, a sticky price and Continue bar on phones, URL-hash steps with working back/forward, sessionStorage resume, lead-time-aware calendar, Edit links on Review, and a mocked $25 deposit. Keep all of that plumbing.

## 2. Findings (all roles, every step)

**Structure and flow**
1. **7 steps is long for one cake.** Occasion is a whole screen that changes nothing (no price, no preview, no suggestions). Contact is a separate screen with three fields. Review repeats everything the desktop summary already shows.
2. **No "start from something".** The homepage shows 9 gorgeous cakes, but the builder starts from a blank form. Most people order by pointing ("like that one, but pink").
3. **Size asks "How many people?" but makes you translate guests to inches.** No guest-count input, and no visual sense of scale (6" vs 10" look identical as cards).

**The cake itself**
4. **The "preview" is a 96px clip-art icon** in the corner of the summary. It barely changes (frosting color and a stripe) and still uses the old pink. It reads as decoration, not feedback.
5. **Flavors are colored dots; fillings have no visual at all.** Nobody can picture "Prestígio" from a brown dot. There's no guidance either (no pairings, no "most loved").
6. **The Design step is three empty inputs** (upload, message, colors). It's the most emotional step and the least designed. The 9 cake styles Marcia actually makes aren't offered as choices.
7. **The message isn't shown on the cake** anywhere.

**Price and trust**
8. **The price never moves.** "from $65" stays fixed no matter the flavor, design or add-ons. There's no breakdown and no sense of what drives cost. The tiered option just says "Quote" with no explanation.
9. **"SAMPLE" tags** appear on the size step, the summary and the deposit. They're mockup noise; the footer already says it's a concept.
10. **The deposit box on Review uses a red border and red wash.** That's error styling, so the most important trust moment looks like a warning.

**Chrome and polish**
11. **The full site header stays on the page**, including an "Order a cake" button that links to the page you're already on, plus four nav links that pull people out mid-order.
12. **Two titles:** a "Design your cake" italic line, then the step H1.
13. **Error state:** when nothing is picked, every card turns red. Heavy, and it reads as "everything is wrong".
14. **Accessibility:** the option groups use `role="radio"` but have no arrow-key movement (every card is a separate Tab stop), and their `aria-label` is the raw id ("occasion"), not translated text.
15. **Pickup calendar:** past dates are struck through (seven rows of crossed-out numbers is visual noise). The 10 time slots are one undifferentiated grid.
16. **Contact asks for email as required.** Marcia confirms by text, so email should be optional.
17. **Phones have no access to the summary at all.** The desktop sidebar is hidden on mobile, so people can't check what they picked without going to Review.

**After ordering**
18. **The confirmation is a receipt, not a reassurance.** There's no "what happens next", no add-to-calendar, no directions, no way to text Marcia.

## 3. Patterns that fit (Mobbin)

| Pattern | Reference | What we take |
|---|---|---|
| Product as the stage, options in a side panel, tabs for parts | [Givingli customizer](https://mobbin.com/screens/b33e0752-c151-4eb6-8a09-12488bb08e42) | A big live cake on the left (desktop) or top (phone). Options sit beside it. The cake reacts to every choice. |
| Size cards plus a finish option with a thumbnail, and a live subtotal above Continue | [Canva print](https://mobbin.com/screens/e0ec1f04-f743-44ff-a9cf-ba44117a1a2e) | Size cards with scale drawings, design-style cards with real photos, and a running subtotal pinned above the button. |
| Ingredients as round photo chips | [CHOPT](https://mobbin.com/screens/699fa1bd-da62-4562-b99d-d9c1568e3d1f), [Wonder](https://mobbin.com/screens/b3fda39f-db98-4f42-bc63-7ceccf0e38b7) | Flavors and fillings as round texture swatches with the name under them. |
| Add-ons with price deltas and thumbnails | [DoorDash add-ons](https://mobbin.com/screens/6d761cb4-cf23-4618-be57-3cec4eed9194), [Shake Shack](https://mobbin.com/screens/1f9ea52d-ea83-49a1-b8f9-8bcb9fb5a866) | "Fresh strawberries +$8", "Gold leaf +$12", "Topper +$10", each shown as a delta and added to the live price. |
| Confirmation with a progress tracker | [sweetgreen order received](https://mobbin.com/screens/8d796f46-432e-4062-a7a7-17089c5c3c54), [Faire](https://mobbin.com/screens/85a2767e-6b77-48e6-8834-d08490f9f882) | Requested, then Marcia confirms (within 24h), then Baking, then Ready for pickup. |

## 4. The redesign

### 4.1 Flow: 7 steps become 5, plus Review
| New step | Merges | Why |
|---|---|---|
| **1. Start** | Occasion, plus a new "start from a cake" option | Two doors: **"Start from one of Marcia's cakes"** (the 9-cake gallery as large photo cards) or **"Start from scratch"**. Occasion becomes a chip row on this screen (Birthday, Wedding, Baby shower, Graduation, Just because). It sets a default message and suggests sizes. |
| **2. Size** | Size | A guest-count stepper ("How many guests?") auto-selects the right size. Size cards show **drawn cakes at true relative scale** with a person icon for reference, servings, price from, and lead time. Tiered says "Custom quote · Marcia replies within 24h". |
| **3. Inside** | Flavor + filling | Round **texture swatches** (see photo needs §6). A "Marcia's favorite pairings" row (e.g. Brigadeiro + Morango, Ninho + Maracujá, Prestígio + Coco) picks both with one tap. "Most loved" badge on 2. Premium flavors show a +$ delta. |
| **4. Outside** | Design | **Style cards built from our 9 retouched cake photos:** Ridged buttercream, Floral garden, Chocolate drip, Brigadeiro sprinkles, Vintage piping, Brushstroke, Character/topper, Two-tone. Then color chips (with a custom option), the message with a live preview on the cake, add-ons with price deltas (fresh fruit, gold leaf, edible flowers, topper, fondant figure), and optional inspiration upload. |
| **5. Pickup** | Pickup + Contact | Calendar plus time, then name, mobile (required) and email (optional), with "Text me updates" on by default. |
| **Review & deposit** | Review | A receipt-style summary with the cake preview, inline Edit links, a price breakdown, neutral (not red) deposit styling, a refund line, and the Pay button. |

Desktop stepper labels: **Start · Size · Inside · Outside · Pickup**, then Review.

### 4.2 The live cake stage (the signature)
- **Desktop:** a two-column layout. The **left column is a large sticky stage** (~520px) with an illustrated cake drawn in layered SVG. It reacts to:
  - **Size:** the cake's width scales and the number of tiers changes.
  - **Flavor:** a cutaway wedge shows the sponge color.
  - **Filling:** a stripe in the cutaway.
  - **Style:** ridges, drip, sprinkles, flowers, piping, brushstroke.
  - **Color:** the frosting tint.
  - **Message:** piped on a top plaque.
  - **Add-ons:** strawberries, gold flakes, a topper silhouette.
  
  The right column holds the options. The price and Continue sit pinned at the bottom of the right column.
- **When people start from a gallery cake**, the stage shows **that real photo** with a "Your version of this cake" badge, and the choices list as edits on top of it. This is honest and much more motivating than the illustration.
- **Phones:** the stage collapses to a compact 120px strip at the top (the cake plus its name and price), with "View cake" to expand it full-screen. The bottom bar keeps price and Continue, and adds a "Your cake" sheet for the summary.
- **Motion:** 200ms crossfades for color and texture, and a gentle scale when the size changes. `prefers-reduced-motion` turns all of it off.
- **Style:** the illustration matches the site: cream board, chocolate outlines at low opacity, mural-red candle flame, and a rose-pink accent kept to the cake world.

### 4.3 Price that explains itself
- The live estimate is the base by size, plus premium flavor (+$5), plus style complexity (simple $0, floral or piping +$15, character/fondant +$25), plus add-ons. All numbers are made up for the mockup.
- It's shown as **"Estimated $78"** with a "See breakdown" disclosure. Tiered shows "Custom quote".
- The deposit line reads "$25 today holds your date · balance at pickup".

### 4.4 Review & deposit
- One compact receipt card: cake thumbnail (the stage render or the source photo), each section on one line with Edit, a price breakdown, then the total estimate.
- Deposit block in neutral cream with a check icon (no red border): "Refundable up to 72 hours before pickup" (made up), plus "Marcia confirms the final price by text within 24h".
- The pay button looks like a real checkout: "Pay $25 deposit" with card, Apple Pay and Google Pay marks (still mocked).

### 4.5 Confirmation
- A celebratory header with the order number and a short, warm line in Marcia's voice.
- **Progress tracker:** Requested ✓, then Marcia confirms (by tomorrow 6 PM), then Baking (Thu), then Ready for pickup (Fri 9 AM).
- Actions: **Add to calendar** (a client-generated .ics), **Get directions**, **Text Marcia**, and "Start another cake".
- A compact summary with the cake render; no more six bordered boxes.

### 4.6 Chrome, copy and accessibility
- **Checkout-mode header** on `/order-cake`: logo (links home with a "leave? your cake is saved" note), a centered stepper on desktop, and "Questions? (980) 406-3654" on the right. The site nav and the self-linking "Order a cake" button go away.
- Remove the duplicate "Design your cake" line and all `SampleTag`s.
- **Errors:** one message under the group with a soft shake (reduced-motion safe); cards keep their normal border; focus moves to the group.
- **Radio groups:** a roving tabindex with arrow keys (one Tab stop per group), and a translated `aria-labelledby` pointing at the visible heading.
- **Calendar:** open on the first available month; past dates simply faded (no strikethrough); weeks entirely in the past hidden; time slots grouped Morning, Midday and Afternoon; a small "Few slots left" hint on Saturdays (mock).
- **Single-column option cards on phones** wherever names are long (flavors, fillings), so "Doce de Leite / Milk caramel" doesn't wrap into three lines.

### 4.7 Entry points from the homepage
- The cake gallery lightbox gets **"Order one like this"**, which opens `/order-cake?from=cake-floral-tier` with Start pre-filled (that photo as inspiration and the matching style card selected).
- If a draft exists in sessionStorage, the homepage cake section shows a small "Continue your cake: 8″ Brigadeiro, Fri Nov 27" chip.

## 5. Phases
| Phase | Scope | Size |
|---|---|---|
| **1. Quick wins** | Checkout header, remove SAMPLE tags and the duplicate title, neutral deposit, calmer errors, radio arrow keys and labels, email optional, calendar cleanup, single-column cards on phones | Small |
| **2. Flow** | 5-step structure, Start step with two doors and occasion chips, guest-count helper, Pickup + Contact merged, `?from=` prefill | Medium |
| **3. Visual options** | Style cards from the gallery photos, flavor/filling swatches, pairings, add-ons with deltas, live price + breakdown | Medium |
| **4. Live cake stage** | Layered SVG cake that reacts to every choice; photo mode for gallery starts; phone strip + "View cake" + summary sheet | Large (the signature) |
| **5. After ordering** | Confirmation tracker, .ics, directions/text actions, "Order one like this" in the lightbox, resume-draft chip | Small–medium |
| **6. Verify** | Full flow in EN/PT at 390 and 1440, keyboard-only run, tiered quote path, lead-time date invalidation, back/forward and refresh mid-flow, console clean | — |

## 6. Photos

**Already have, no action needed:** the 9 retouched cake photos power the Start gallery and the style cards. I can also pull more styles from the Google listing (a kids' number-4 cake, a floral cream cake, a brushstroke cake) under the permission you already gave.

**Would make it noticeably better (from you or the bakery):**
1. **Slice/cross-section photos** showing the inside of a cake, ideally one per flavor (Brigadeiro, Beijinho, Doce de Leite, Prestígio, Ninho, Red Velvet) and filling (Brigadeiro, Ninho, Morango, Maracujá, Doce de Leite, Coco). Even 3–4 slices would let the "Inside" step show real texture. **Without them I'll draw illustrated crumb-and-filling swatches**, which look clean and honest but less mouth-watering.
2. *(Optional)* A photo of the **cake box / pickup moment** for the confirmation screen.
3. *(Optional)* Close-ups of **toppers or fondant figures** Marcia offers, for the add-ons.
