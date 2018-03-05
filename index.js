const puppeteer = require('puppeteer');
const fetch = require('cross-fetch');
const fs = require('fs');

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

  console.log(`Opening dialgen page`);
  const browser = await puppeteer.launch({ headless: HEADLESS });
  const page = await browser.newPage();
  await page.goto('http://xwvassal.info/dialgen/dialgen');

  const input = await page.$('input[name=inputbox]');

  for (const i in ships) {
    const ship = ships[i];
    if (ship.size === "huge" || !ship.dial || ship.dial.length === 0) {
      console.log(`Skipping ${ship.name}`);
      continue;
    }

    resetInput(page, input);

    console.log(`Generating dial for ${ship.name}`);
    await page.type('input[name=inputbox]', ` .${ship.dial.join(',')}`);
    await page.click('input[name=button]');

    const imagePath = `dials/${ship.name.replace(/[\/\.]/g, '')}.png`;
    console.log(`Saving dial image in ${imagePath}`);
    const dialCanvas = await page.$('#myCanvas');
    await dialCanvas.screenshot({
      path: `images/${imagePath}`,
      omitBackground: true,
    });

    ships[i]['dial_image'] = imagePath;
  }

  await input.dispose();

  console.log(`Closing dialgen page`);
  await browser.close();

  console.log(`Saving ships json`);
  fs.writeFileSync('ships.js', JSON.stringify(ships, null, 2), 'utf8');

  console.log(`\nTook ${Date.now() - start}ms`);
})();