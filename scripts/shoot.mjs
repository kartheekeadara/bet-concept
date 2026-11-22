// Screenshots + click-through check. Run with a server up (npm run build && npx next start -p 3200):
//   node scripts/shoot.mjs [baseUrl] [testImage]
// Writes screenshots/{en,pt}-home-{390,1440}.png and screenshots/{en,pt}-cake-{390,1440}-step{N}.png
// Fails on console errors, page errors, or horizontal scroll.
import puppeteer from "puppeteer-core";

const base = process.argv[2] || "http://localhost:3200";
const testImage = process.argv[3];
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

async function open(path, w, lang) {
  const page = await browser.newPage();
  const mobile = w < 768;
  await page.setViewport({ width: w, height: mobile ? 844 : 900, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((l) => {
    try { localStorage.setItem("bet-lang", l); sessionStorage.clear(); } catch {}
  }, lang);
  page.on("console", (m) => m.type() === "error" && problems.push(`[${lang} ${w} ${path}] console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`[${lang} ${w} ${path}] pageerror: ${e.message}`));
  await page.goto(base + path, { waitUntil: "networkidle0" });
  // scroll through once so lazy images load before full-page captures
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    // images inside display:none (e.g. the desktop-only hero card on phones) never load, so cap the wait
    const loads = [...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))));
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 5000))]);
    window.scrollTo(0, 0);
  });
  const broken = await page.$$eval("img", (imgs) => imgs.filter((i) => i.offsetParent !== null && i.complete && i.naturalWidth === 0).map((i) => i.src));
  if (broken.length) problems.push(`[${lang} ${w} ${path}] broken images: ${broken.join(", ")}`);
  await wait(400);
  return page;
}

async function checkOverflow(page, label) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  if (o.sw > o.iw) problems.push(`${label}: horizontal scroll (${o.sw} > ${o.iw})`);
}

async function clickText(page, text) {
  const ok = await page.evaluate((txt) => {
    const el = [...document.querySelectorAll("button, a")].find((b) => b.offsetParent !== null && b.textContent.trim().startsWith(txt));
    if (el) el.click();
    return !!el;
  }, text);
  if (!ok) throw new Error(`No visible button "${text}"`);
  await wait(250);
}

const T = {
  en: { cont: "Continue", pay: "Pay $25" },
  pt: { cont: "Continuar", pay: "Pagar sinal" },
};

for (const lang of ["en", "pt"]) {
  for (const w of [390, 1440]) {
    // HOME
    const home = await open("/", w, lang);
    await checkOverflow(home, `${lang} home ${w}`);
    const htmlLang = await home.evaluate(() => document.documentElement.lang);
    if (htmlLang !== (lang === "pt" ? "pt-BR" : "en")) problems.push(`${lang}: html lang is ${htmlLang}`);
    // placeholders: only Marcia's photo may still be missing
    const ph = await home.$$eval('[role="img"][aria-label]', (els) => els.map((e) => e.getAttribute("aria-label")).filter((l) => /Photo needed|Foto necessária/.test(l)));
    if (ph.length !== 1 || !/Marcia/.test(ph[0])) problems.push(`${lang} ${w}: placeholders = ${JSON.stringify(ph)}`);
    // sticky menu tabs must let go once #menu ends
    const tabsLeak = await home.evaluate(async () => {
      const cakes = document.getElementById("cakes");
      window.scrollTo(0, cakes.getBoundingClientRect().top + window.scrollY + 200);
      await new Promise((r) => setTimeout(r, 200));
      const tabs = document.querySelector('[aria-label="Menu categories"], [aria-label="Categorias do cardápio"]').parentElement;
      const r = tabs.getBoundingClientRect();
      const res = r.bottom > 0 && r.bottom > cakes.getBoundingClientRect().top + 1;
      window.scrollTo(0, 0);
      return res;
    });
    if (tabsLeak) problems.push(`${lang} ${w}: menu tabs still stuck over #cakes`);
    // hero contrast sample: hide the hero text and capture what sits behind the headline
    if (lang === "en") {
      await home.evaluate(() => window.scrollTo(0, 0));
      const box = await home.$eval("#hero-title", (h) => {
        const sec = h.closest("section");
        sec.querySelectorAll("h1, p, a").forEach((e) => (e.style.visibility = "hidden"));
        const rg = document.createRange();
        rg.selectNodeContents(h);
        const r = rg.getBoundingClientRect(); // the glyphs, not the full-width block
        return { x: r.left, y: r.top + window.scrollY, width: Math.min(r.width, window.innerWidth - r.left), height: r.height };
      });
      await home.screenshot({ path: `screenshots/hero-bg-${w}.png`, clip: box });
      await home.evaluate(() => document.querySelectorAll("#hero-title, section p, section a").forEach((e) => (e.style.visibility = "")));
    }
    await home.evaluate(() => document.querySelectorAll(".fixed.bottom-0").forEach((e) => (e.style.display = "none")));
    await home.evaluate(() => (document.querySelector("header").style.position = "relative"));
    await home.screenshot({ path: `screenshots/${lang}-home-${w}.png`, fullPage: true });
    await home.evaluate(() => (document.querySelector("header").style.position = ""));
    if (w === 390) {
      await home.evaluate(() => document.querySelectorAll(".fixed.bottom-0").forEach((e) => (e.style.display = "")));
      await home.evaluate(() => window.scrollTo(0, 0));
      await home.screenshot({ path: `screenshots/${lang}-home-390-first.png` });
    }
    await home.close();

    // CAKE FLOW
    const p = await open("/order-cake", w, lang);
    const shot = async (n) => {
      await checkOverflow(p, `${lang} cake ${w} step ${n}`);
      await p.evaluate(() => (document.querySelector("header").style.position = "relative"));
      await p.screenshot({ path: `screenshots/${lang}-cake-${w}-step${n}.png`, fullPage: true });
      await p.evaluate(() => (document.querySelector("header").style.position = ""));
    };
    // validation: continue without choosing
    await clickText(p, T[lang].cont);
    await shot("1-error");
    await p.$eval('[role="radiogroup"] [role="radio"]', (e) => e.click());
    await shot(1);
    await clickText(p, T[lang].cont);
    const radios2 = await p.$$('[role="radio"]');
    await radios2[1].evaluate((e) => e.click()); // 8"
    await shot(2);
    await clickText(p, T[lang].cont);
    const groups = await p.$$('[role="radiogroup"]');
    await (await groups[0].$('[role="radio"]')).evaluate((e) => e.click());
    await (await groups[1].$$('[role="radio"]'))[3].evaluate((e) => e.click());
    await shot(3);
    await clickText(p, T[lang].cont);
    if (testImage) {
      const input = await p.$("#f-photo");
      await input.uploadFile(testImage);
      await wait(300);
    }
    await p.type("#f-message", "Parabéns, Sofia! Feliz aniversário de 7 anos!!"); // > 40 chars, should clip
    const msgLen = await p.$eval("#f-message", (e) => e.value.length);
    if (msgLen > 40) problems.push(`message not limited: ${msgLen}`);
    await p.type("#f-colors", "Pink and gold");
    await shot(4);
    await clickText(p, T[lang].cont);
    // date: first enabled day; if none this month, go next month
    let day = await p.$("[data-ymd]:not([disabled])");
    if (!day) {
      await p.click('[aria-label="Next month"], [aria-label="Próximo mês"]');
      await wait(200);
      day = await p.$("[data-ymd]:not([disabled])");
    }
    const ymd = await day.evaluate((e) => e.dataset.ymd);
    const dow = new Date(ymd + "T12:00:00Z").getUTCDay();
    if (dow === 1) problems.push(`Monday ${ymd} is selectable`);
    await day.evaluate((e) => e.click());
    await wait(200);
    await (await p.$$('[role="radio"][aria-checked]'))[0].evaluate((e) => e.click());
    await shot(5);
    await clickText(p, T[lang].cont);
    // contact validation first
    await clickText(p, T[lang].cont);
    await shot("6-error");
    await p.type("#f-name", "Ana Souza");
    await p.type("#f-phone", "7045550123");
    await p.type("#f-email", "ana@example.com");
    await shot(6);
    await clickText(p, T[lang].cont);
    await shot(7);
    // browser back from review goes to step 6 and keeps data
    await p.goBack();
    await wait(300);
    const name = await p.$eval("#f-name", (e) => e.value).catch(() => null);
    if (name !== "Ana Souza") problems.push(`${lang} ${w}: back button lost state (name=${name})`);
    await p.goForward();
    await wait(300);
    await clickText(p, T[lang].pay);
    await wait(300);
    await shot("done");
    await p.close();
  }
}

await browser.close();
if (problems.length) {
  console.log("PROBLEMS:\n" + problems.join("\n"));
  process.exit(1);
}
console.log("OK: all pages and cake steps rendered, no console errors, no horizontal scroll.");
