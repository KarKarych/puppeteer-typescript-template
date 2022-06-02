const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const randomUseragent = require('random-useragent');

const http = require("http");

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';

// return document.documentElement.innerText


async function getData(search, c, n, p) {
  const browser = await puppeteer.launch(
    {
      headless: true, executablePath: process.env.CHROME_BIN || null, args: [
        '--no-sandbox', '--disable-setuid-sandbox',
      ], ignoreHTTPSErrors: true, dumpio: false
    }
  );

  let page = await browser.newPage();
  const userAgent = randomUseragent.getRandom();
  const UA = userAgent || USER_AGENT;

  await page.setViewport({
    width: 1920 + Math.floor(Math.random() * 100),
    height: 3000 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  await page.setUserAgent(UA);
  await page.setJavaScriptEnabled(true);
  await page.setDefaultNavigationTimeout(0);

  let url = "https://www.ozon.ru/category/nastolnye-i-kartochnye-igry-13506"
  await page.goto(url + "/?text=" + search)

  let texts = await page.evaluate((c, n, p) => {
    let data = []

    let elements = document.getElementsByClassName(c)

    console.log(document.documentElement.innerText)
    for (let element of elements) {

      let nameTag = element.getElementsByClassName(n)[0]
      let temp1 = nameTag.getElementsByTagName("span")[0];
      let nameV = temp1 ? temp1.innerText.replace(/\\"/g, '"') : ""

      let priceInnerText = element.getElementsByClassName(p)[0]

      let priceV = priceInnerText ? priceInnerText.innerText.replace(/[^.0-9]/g, '') : ""

      let temp2 = element.getElementsByTagName("a")[0];
      let linkV
      if (temp2) {
        let indexOf = temp2.href.indexOf(`/?`);
        linkV = temp2.href.substring(0, indexOf)
      } else {
        linkV = ""
      }

      let temp3 = element.getElementsByTagName("img")[0];
      let photoLinkV = temp3 ? temp3.src : ""

      let elementProduct = {
        name: nameV, price: priceV, link: linkV, photo_link: photoLinkV,
      }

      data.push(elementProduct)
    }

    // data = data.length !== 0 ? data : document.documentElement.innerText
    return data
  }, c, n, p);

  await browser.close();

  return texts
}

async function getPriceData(link, l) {
  const browser = await puppeteer.launch(
    {
      headless: true, executablePath: process.env.CHROME_BIN || null, args: [
        '--no-sandbox', '--disable-setuid-sandbox',
      ], ignoreHTTPSErrors: true, dumpio: false
    }
  );

  let page = await browser.newPage();
  const userAgent = randomUseragent.getRandom();
  const UA = userAgent || USER_AGENT;

  await page.setViewport({
    width: 1920 + Math.floor(Math.random() * 100),
    height: 3000 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  await page.setUserAgent(UA);
  await page.setJavaScriptEnabled(true);
  await page.setDefaultNavigationTimeout(0);

  await page.goto(link)

  let texts = await page.evaluate((l) => {

    let price = document.getElementsByClassName(l)[0]

    if (!price) {
      return 1337228
    }

    return parseInt(price.innerText.replace(/[^.0-9]/g, ''))
  }, l);

  await browser.close();

  return texts
}


const requestListener = function (req, res) {

  const params = new Proxy(new URLSearchParams(req.url.substring(1)), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  if (params.search && params.c && params.n && params.p) {

    console.log(params.search)
    console.log(params.c)
    console.log(params.n)
    console.log(params.p)

    getData(params.search, params.c, params.n, params.p).then(items => {
      res.writeHead(200, {'Content-Type': 'application/json'});

      if (items.length === 0) {
        res.end(JSON.stringify({items: []}, null, 2));
      } else {
        res.end(JSON.stringify({items}, null, 2));
      }

    }).catch(err => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({items: []}, null, 2));
    });
  } else if (params.link && params.l) {

    console.log(params.link)
    console.log(params.l)

    getPriceData(params.link, params.l).then(price => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({price: price}, null, 2));
    }).catch(err => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({price: 1337228}, null, 2));
    });
  } else {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: "Виктория, господа. Вы не по адресу"}));
  }
};

const server = http.createServer(requestListener);

let server_port = process.env.YOUR_PORT || process.env.PORT || 8999;
let server_host = process.env.YOUR_HOST || '0.0.0.0';
server.listen(server_port, server_host, function () {
  console.log('Listening on port %d', server_port);
});



