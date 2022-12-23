const puppeteer = require('puppeteer');
const prompt = require('prompt');

(async () => {
  // Fetch arguments from CLI
  const argv = require('minimist')(process.argv.slice(2));

  // if using infinite pass --iteration=infinite args
  const { iteration = 5, uselogin = false } = argv;

  // Will prompt username and password if uselogin args is true
  const credentials = uselogin
    ? await new Promise((resolve, reject) => {
        const properties = [
          {
            name: 'username',
          },
          {
            name: 'password',
            hidden: true,
          },
        ];

        prompt.start();
        prompt.get(properties, function (err, result) {
          if (err) {
            reject(err);
            console.log(err);
            return 1;
          }
          resolve(result);
        });
      })
    : {};

  // General constants
  const tiktokUrl = 'http://www.tiktok.com';
  const { username = '', password = '' } = credentials;

  // Selectors constants
  const homeLoginButton = 'button[data-e2e="top-login-button"';
  const loginWithEmailXpath = '//p[contains(text(), "Use phone / email / username")]';
  const loginWithEmail2ndXpath = '//a[contains(text(), "Log in with email or username")]';
  const inputEmailSelector = 'input[name="username"';
  const inputPasswordSelector = 'input[placeholder="Password"';
  const submitLoginSelector = 'button[data-e2e="login-button"';
  const closeButtonSelector = 'div[data-e2e="modal-close-inner-button"]';
  const likeButtonSelector = 'span[data-e2e="like-icon"]';
  const dragThePuzzleXpath = '//div[contains(text(), "Drag the slider to fit the puzzle")]';

  // Helper functions
  const waitAndClickXpath = async (xpath) => {
    await page.waitForXPath(xpath);
    const element = await page.$x(xpath);
    await element[0].click();
  };
  const waitAndClickSelector = async (selector) => {
    await page.waitForSelector(selector);
    await page.click(selector);
  };
  const waitForTimeout = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
  const randomDelayWithInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  };

  // Starts the automation
  const browser = await puppeteer.launch({
    // using Chrome instead of Chromium due to bug when Chromium opens tiktok keep getting crashed
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
  });
  const page = await browser.newPage();

  // set view port and open tiktok page
  page.setViewport({ width: 1280, height: 800, isMobile: false });
  await page.goto(tiktokUrl, { timeout: 0 });

  // Login flow
  if (username && password) {
    await waitAndClickSelector(homeLoginButton);
    await waitAndClickXpath(loginWithEmailXpath);
    await waitAndClickXpath(loginWithEmail2ndXpath);
    await page.type(inputEmailSelector, username);
    await page.type(inputPasswordSelector, password);
    await page.click(submitLoginSelector);
    await page.waitForSelector(closeButtonSelector, { hidden: true, timeout: 0 });
  }

  // Begin the iteration of liking post
  let i = 1;
  while (iteration === 'infinite' ? true : i <= iteration) {
    const listItemSelector = `div[data-e2e="recommend-list-item-container"]:nth-of-type(${i})`;
    const likeButton = `${listItemSelector} ${likeButtonSelector}`;

    await waitAndClickSelector(likeButton);

    // For non login user, will require to close login pop up everytime clicking like button
    await waitForTimeout(1000);
    if ((await page.$(closeButtonSelector)) !== null) {
      await page.click(closeButtonSelector);
      await page.waitForSelector(closeButtonSelector, { hidden: true, timeout: 0 });
    }
    await page.keyboard.press('ArrowDown');

    // A random delay to prevent activity being recognized as bot
    await waitForTimeout(randomDelayWithInterval(5, 7));
    i++;
  }
  console.log('finished');
})();
