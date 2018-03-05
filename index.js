const puppeteer = require('puppeteer');
const fetch = require('cross-fetch');

const HEADLESS = true;

const resetInput = async (page, inputHandle) => {
  return await page.evaluate((input) => input.value = '', inputHandle);
}

(async () => {
  const start = Date.now();

  console.log('Fetching xwing-data ships');
  const request = await fetch('https://raw.githubusercontent.com/guidokessels/xwing-data/master/data/ships.js');
  if (!request.ok) {
    throw new Error(`Couldn't load ships :(`);
  }
  const ships = await request.json();
  console.log(`Loaded ${ships.length} ships`);

  const dialShips = ships.filter(s => s.size !== "huge" && s.dial && s.dial.length > 0);
  console.log(`Found ${dialShips.length} ships with dials`);

  console.log(`Opening dialgen page`);
  const browser = await puppeteer.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.goto('http://xwvassal.info/dialgen/dialgen');

  const input = await page.$('input[name=inputbox]');

  for (const ship of dialShips) {
    resetInput(page, input);

    console.log(`Generating dial for ${ship.name}`);
    await page.type('input[name=inputbox]', `${ship.name}.${ship.dial.join(',')}`);
    await page.click('input[name=button]');

    console.log(`Saving dial image for ${ship.name}`);
    const dialCanvas = await page.$('#myCanvas');
    await dialCanvas.screenshot({
      path: `dial-images/${ship.xws}.png`,
      omitBackground: true,
    });
  }

  await input.dispose();

  console.log(`Closing dialgen page`);
  await browser.close();

  console.log(`\nTook ${Date.now() - start}ms`);
})();