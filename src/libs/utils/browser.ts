import type { Browser } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';

let browser: Browser;

export const getBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  return browser;
};
