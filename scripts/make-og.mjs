// Renders public/og.png (1200x630): a typographic brand card, no imagery. Used until a real og.jpg/hero.jpg is added.
import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,600&family=Nunito+Sans:wght@700&display=swap" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;background:#3E2318;color:#FBF4EA;font-family:'Nunito Sans';display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box}
h1{font-family:Fraunces;font-size:150px;line-height:.95;margin:0}p{font-family:Fraunces;font-style:italic;font-size:40px;margin:24px 0 0}
.b{position:absolute;left:90px;top:70px;font-family:Fraunces;font-size:34px}.b i{color:#F4A6C2}.f{position:absolute;left:90px;bottom:60px;font-size:24px;color:#F4A6C2;letter-spacing:.12em;text-transform:uppercase}</style></head>
<body><div class="b">Brazilian Eats <i>&amp; Treats</i></div><h1>Sabor de casa.</h1><p>A taste of home, right here in Ballantyne.</p><div class="f">Bakery · Lunch · Custom cakes — Charlotte, NC</div></body></html>`, { waitUntil: "networkidle0" });
await page.screenshot({ path: "public/og.png" });
await browser.close();
console.log("public/og.png written");
