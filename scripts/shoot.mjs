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
