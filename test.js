const puppeteer = require('puppeteer')
const Rembrandt = require('rembrandt')
async function run () {
  const url = 'https://m.sw11.icu/m/login'
  const email = ''
  const password = ''
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(url)
  await page.type('input[name="email"]', email)
  await page.type('input[name="passwd"]', password)
  await page.waitForTimeout(1000)
  await page.click('button[type="submit"]')
  await page.waitForSelector('.bgContainer')
  const isSuccess = await moveSlide(page)
  if (isSuccess) {
    await page.waitForTimeout(2000)
    await page.click('[name="checkin"]')
  }
  // browser.close()
}
let tryTimes = 0
async function moveSlide (page) {
  const bgImg = await page.$('.bgImg')
  const bgImgSrc = await bgImg.getProperty('src')
  const base64 = await page.evaluate((src) => src.replace(/^data:image\/\w+;base64,/, ''), bgImgSrc)
  await bgImgSrc.dispose()
  const bgImgBuffer = Buffer.from(base64, 'base64')
  // const puzzleImg = await page.$('.puzzleImg')
  // const puzzleImgSrc = await puzzleImg.getProperty('src')
  const sliderElement = await page.$('.control')
  const slider = await sliderElement.boundingBox()

  const sliderHandle = await page.$('.pl-8.slider')
  const handle = await sliderHandle.boundingBox()
  let currentPosition = 0
  const bestSlider = {
    position: 0,
    difference: 100
  }
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.addStyleTag({ content: '.reset-btn{display:none !important;}' })
  // return false
  while (currentPosition < slider.width - handle.width / 2) {
    await page.mouse.move(
      handle.x + currentPosition,
      handle.y + handle.height / 2 + Math.random() * 10 - 5
    )
    const sliderContainer = await page.$('.bgContainer')
    const sliderImage = await sliderContainer.screenshot()
    const rembrandt = new Rembrandt({
      imageA: bgImgBuffer,
      imageB: sliderImage,
      thresholdType: Rembrandt.THRESHOLD_PERCENT
    })
    const result = await rembrandt.compare()
    const difference = result.percentageDifference * 100
    if (difference < bestSlider.difference) {
      // fs.writeFile('sliderImage' + currentPosition + '.png', sliderImage, (e) => { if (e)console.log(e) })
      bestSlider.difference = difference
      bestSlider.position = currentPosition
    }
    currentPosition += 4
  }
  await page.mouse.move(handle.x + bestSlider.position, handle.y + handle.height / 2, { steps: 10 })
  await page.mouse.up()
  const response = await page.waitForResponse('https://m.sw11.icu/api_mweb/captcha/check')
  const data = await response.json()
  if (data.data) {
    return true
  } else {
    if (tryTimes < 5) {
      tryTimes++
      await page.waitForTimeout(2000)
      return moveSlide(page)
    }
  }
  return false
}

run()
