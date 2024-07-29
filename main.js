const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

async function getCFData(username) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`https://codeforces.com/profile/${username}`);
    const data = await page.content();
    const $ = cheerio.load(data);
    const cf_data = {};

    const usernameElement = $('a.rated-user.user-gray').first();
    const usernameText = usernameElement.text() || "N/A";

    const ratingElements = $('span.user-gray');
    const rating = ratingElements.eq(1).text() || "N/A";

    const problemElement = $('div._UserActivityFrame_counterValue').first();
    const problems = problemElement.text() || "N/A";

    const days = $('div._UserActivityFrame_counterValue');
    const solvedForAllTime = days.eq(0).text() || "N/A";
    const solvedForTheLastYear = days.eq(1).text() || "N/A";
    const solvedForTheLastMonth = days.eq(2).text() || "N/A";
    const rowsInMax = days.eq(3).text() || "N/A";
    const inARowForLastYear = days.eq(4).text() || "N/A";
    const inARowForLastMonth = days.eq(5).text() || "N/A";

    cf_data['username'] = username;
    cf_data['rating'] = rating;
    cf_data['solved_for_all_time'] = solvedForAllTime;
    cf_data['solved_for_the_last_year'] = solvedForTheLastYear;
    cf_data['solved_for_the_last_month'] = solvedForTheLastMonth;
    cf_data['rows_in_max'] = rowsInMax;
    cf_data['in_a_row_for_last_year'] = inARowForLastYear;
    cf_data['in_a_row_for_last_month'] = inARowForLastMonth;

    await browser.close();
    return cf_data;
}

async function getLCData(username) {
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null, // Disable default viewport
        args: [
            '--start-maximized' // Start the browser maximized
        ]
    });
    const page = await browser.newPage();
    await page.goto(`https://leetcode.com/${username}`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds

    // Get the viewport size after the page loads
    const { width, height } = await page.evaluate(() => {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    });
 // Wait for 3 seconds
    const data = await page.content();
    const $ = cheerio.load(data);
    const LCData = {};

    const problems = $('span.text-[30px] font-semibold leading-[32px]').first().text() || "N/A";
    const rating = $('div.text-label-1.flex.items-center.text-2xl').first().text() || "N/A";
    const totalActiveDays = $('span.font-medium.text-label-2').first().text() || "N/A";
    const maxStreak = $('span.font-medium.text-label-2').eq(1).text() || "N/A";

    const images = $('img').slice(2, -1);
    const badges = [];
    images.each((index, img) => {
        badges.push($(img).attr('alt'));
    });

    const types = $('div.text-sd-foreground.text-xs.font-medium');
    const easy = types.eq(0).text() || "N/A";
    const medium = types.eq(1).text() || "N/A";
    const hard = types.eq(2).text() || "N/A";

    const rank = $('span.ttext-label-1.font-medium').first().text().replace(",", "") || "N/A";

    LCData['username'] = username;
    LCData['problems'] = problems;
    LCData['rating'] = rating;
    LCData['total_active_days'] = totalActiveDays;
    LCData['max_streak'] = maxStreak;
    LCData['badges'] = badges;
    LCData['easy'] = easy;
    LCData['medium'] = medium;
    LCData['hard'] = hard;
    LCData['rank'] = rank;

    await browser.close();
    return LCData;
}

app.get('/', (req, res) => {
    res.send('<h1>Welcome to Code API</h1><h3>use /api/codeforces/&lt;username&gt; for Codeforces</h3><h3>use /api/leetcode/&lt;username&gt; for Leetcode</h3>');
});

app.get('/api/codeforces/:username', async (req, res) => {
    const username = req.params.username;
    const cf_data = await getCFData(username);
    res.json(cf_data);
});

app.get('/api/leetcode/:username', async (req, res) => {
    const username = req.params.username;
    const lc_data = await getLCData(username);
    res.json(lc_data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
