import {after, before, describe, it} from "mocha";
import {assert} from "chai";
import {Builder, By, logging, WebDriver, WebElement} from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import firefox from "selenium-webdriver/firefox";

const BROWSER_NAME = <string>process.env.BROWSER;
const ORIENTATION = <string>process.env.ORIENTATION;

const WHProperty = ORIENTATION === "horizontal" ? "width" : "height";
const minWHProperty = ORIENTATION === "horizontal" ? "min-width" : "min-height";
const URL = "http://localhost:3000/test-space";
const DEFAULT_SPLITTER_SIZE = 7;
const PARENT_ELEMENT_SELECTOR = ".ui-splitter-container";
const FIRST_ELEMENT_SELECTOR = ".ui-splitter-first-element";
const SPLIT_ELEMENT_SELECTOR = ".ui-splitter-split-element";
const SPLIT_CLONE_ELEMENT_SELECTOR = ".ui-splitter-split-element.clone";
const SECOND_ELEMENT_SELECTOR = ".ui-splitter-second-element";
const DEFAULT_SIZE = 1000;

let driver: WebDriver;
const chromeOptions = new chrome.Options();
chromeOptions.headless();
chromeOptions.windowSize({
    height: DEFAULT_SIZE,
    width: DEFAULT_SIZE
})

const firefoxOptions = new firefox.Options();
firefoxOptions.headless();
firefoxOptions.windowSize({
    //fixme some bug in firefox webdriver with browser height, should add 74 px to height
    height: DEFAULT_SIZE + 74,
    width: DEFAULT_SIZE
});
firefoxOptions.setPreference('devtools.console.stdout.content', true);

describe(`ui-splitter testing for ${BROWSER_NAME.toUpperCase()} browser in ${ORIENTATION.toUpperCase()} mode`, function () {
    this.timeout(0);
    before(async () => {
        const preferences = new logging.Preferences();
        preferences.setLevel(logging.Type.BROWSER, logging.Level.ALL);
        driver = await new Builder()
            .forBrowser(BROWSER_NAME)
            .setChromeOptions(chromeOptions)
            .setChromeService(new chrome.ServiceBuilder().setStdio('inherit'))
            .setFirefoxOptions(firefoxOptions)
            .setFirefoxService(new firefox.ServiceBuilder().setStdio('inherit'))
            .setLoggingPrefs(preferences)
            .build();
        await driver.get(URL);
    })


    it('should web-driver success open page', async () => {
        assert.equal(await driver.getTitle(), "test-space-ui-splitter");
    });

    it('should window object have split element', async () => {
        await driver.executeScript(`window.createSplitter(\"${ORIENTATION}\")`);
        const splitterObject = await driver.executeScript("function getSplitter() {return window.splitter};return getSplitter()");
        assert.isTrue(typeof splitterObject === "object");
    });

    it(`should splitter object have default options with ${ORIENTATION} orientation`, async () => {
        const splitterObject: any = await driver.executeScript("function getSplitter() {return window.splitter};return getSplitter()");
        assert.equal(splitterObject.orientation, ORIENTATION);
        assert.isTrue(splitterObject.parentElement instanceof WebElement);
        assert.isUndefined(splitterObject.collapsePlug);
        assert.isTrue(splitterObject.firstElement instanceof WebElement);
        assert.isTrue(splitterObject.splitElement instanceof WebElement);
        assert.isTrue(splitterObject.splitButton instanceof WebElement);
        assert.isTrue(splitterObject.splitElementClone instanceof WebElement);
        assert.isTrue(splitterObject.secondElement instanceof WebElement);
        assert.equal(splitterObject.splitterSize, DEFAULT_SPLITTER_SIZE);
        assert.equal(splitterObject._firstElementSize, `calc(50% - ${DEFAULT_SPLITTER_SIZE}px)`);
        assert.equal(splitterObject._secondElementSize, "50%");
        assert.equal(splitterObject.firstElementMinSize, 0);
        assert.equal(splitterObject.secondElementMinSize, 0);
        assert.equal(splitterObject.splitterClassName, "");
        assert.isNull(splitterObject.onDragStart);
        assert.isNull(splitterObject.onDrag);
        assert.isNull(splitterObject.onDragEnd);
        assert.isNull(splitterObject.onSplitButtonClick);
        assert.equal(splitterObject.collapsedCaption, "");
        assert.isFalse(splitterObject.disableCollapse, "disableCollapse");
        assert.equal(splitterObject.collapseMode, "collapse");
        assert.isFalse(splitterObject.hideSplitterOnCollapse, "hideSplitterOnCollapse");
        assert.equal(splitterObject.splitterDirection, "direct");
        assert.isFalse(splitterObject.collapsedOnStart, "collapsedOnStart");
        assert.isUndefined(splitterObject.startPosition);
        assert.isFalse(splitterObject.hideSplitButton, "hideSplitButton");
    });

    it(`should contains all main containers in ${ORIENTATION} mode`, async () => {
        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const splitElementClone = await driver.findElement(By.css(SPLIT_CLONE_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.isTrue(await parentElement.isEnabled());
        assert.isTrue(await firstElement.isEnabled());
        assert.isTrue(await splitElement.isEnabled());
        assert.isTrue(await splitElementClone.isEnabled());
        assert.isTrue(await secondElement.isEnabled());
    });

    it(`should containers have correct sizes for ${ORIENTATION} orientation`, async () => {
        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        const parentSize = await parentElement.getRect();
        const firstElementSize = await firstElement.getRect();
        const splitElementSize = await splitElement.getRect();
        const secondElementSize = await secondElement.getRect();
        assert.equal(parentSize[WHProperty], DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], parentSize[WHProperty] / 2 - DEFAULT_SPLITTER_SIZE);
        assert.equal(splitElementSize[WHProperty], DEFAULT_SPLITTER_SIZE);
        assert.equal(secondElementSize[WHProperty], parentSize[WHProperty] / 2);
        assert.equal(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty], parentSize[WHProperty]);
    });

    it('should split clone element be hidden', async () => {
        const splitElementClone = await driver.findElement(By.css(SPLIT_CLONE_ELEMENT_SELECTOR));
        assert.equal(await splitElementClone.getCssValue("display"), "none");
    });

    it('should after onMouseOver increase button width/height, then decrease', async () => {

        const splitElementButton = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));

        assert.equal(await splitElementButton.getCssValue(WHProperty), `${DEFAULT_SPLITTER_SIZE}px`);

        const actions = driver.actions({async: true});
        await actions.move({origin: splitElementButton}).perform();

        assert.equal(await splitElementButton.getCssValue(WHProperty), `${DEFAULT_SPLITTER_SIZE * 3}px`, "onmouseover");

        await actions.move({x: 0, y: 0}).perform();

        assert.equal(await splitElementButton.getCssValue(WHProperty), `${DEFAULT_SPLITTER_SIZE}px`, "onmouseout");
    });

    it('should set custom width only for first element', async () => {
        await driver.executeScript(`window.changeInitialSizes(\"${ORIENTATION}\", [\"100px\"])`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        assert.equal(await firstElement.getCssValue(WHProperty), `${100 - DEFAULT_SPLITTER_SIZE}px`);
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE - 100}px`);
    });

    it('should set custom width only for second element', async () => {
        await driver.executeScript(`window.changeInitialSizes(\"${ORIENTATION}\", [null,\"100px\"])`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE - 100 - DEFAULT_SPLITTER_SIZE}px`);
        assert.equal(await secondElement.getCssValue(WHProperty), "100px");
    });

    it('should change initial size both elements', async () => {
        await driver.executeScript(`window.changeInitialSizes(\"${ORIENTATION}\", [\"20%\", \"80%\"])`);

        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        const parentSize = await parentElement.getRect();
        const firstElementSize = await firstElement.getRect();
        const splitElementSize = await splitElement.getRect();
        const secondElementSize = await secondElement.getRect();
        assert.equal(parentSize[WHProperty], DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], (parentSize[WHProperty] / 100) * 20 - DEFAULT_SPLITTER_SIZE);
        assert.equal(splitElementSize[WHProperty], DEFAULT_SPLITTER_SIZE);
        assert.equal(secondElementSize[WHProperty], (parentSize[WHProperty] / 100 * 80));
        assert.equal(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty], parentSize[WHProperty]);
    });

    it('should have default elements auto min size', async () => {
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.equal(await firstElement.getCssValue(minWHProperty), "auto");
        assert.equal(await secondElement.getCssValue(minWHProperty), "auto");
    });

    it('should change first minimal element size, second should be auto', async () => {
        await driver.executeScript(`window.changeMinimalSizes(\"${ORIENTATION}\", [100])`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.equal(await firstElement.getCssValue(minWHProperty), "100px");
        assert.equal(await secondElement.getCssValue(minWHProperty), "auto");

    });

    it('should change first and second minimal element size, first should be auto', async () => {
        await driver.executeScript(`window.changeMinimalSizes(\"${ORIENTATION}\", [null, 100])`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.equal(await firstElement.getCssValue(minWHProperty), "auto");
        assert.equal(await secondElement.getCssValue(minWHProperty), "100px");

    });

    it('should change first and second minimal element size, first should be 100, second auto', async () => {
        await driver.executeScript(`window.changeMinimalSizes(\"${ORIENTATION}\", [100,\"auto\"])`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.equal(await firstElement.getCssValue(minWHProperty), "100px");
        assert.equal(await secondElement.getCssValue(minWHProperty), "auto");

    });

    it('should change first and second minimal element size, first/second should be 100', async () => {
        await driver.executeScript(`window.changeMinimalSizes(\"${ORIENTATION}\", [100, 100])`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.equal(await firstElement.getCssValue(minWHProperty), "100px");
        assert.equal(await secondElement.getCssValue(minWHProperty), "100px");

    });

    it('should change splitter size', async () => {
        await driver.executeScript(`window.changeSplitterSize(\"${ORIENTATION}\", 10)`);

        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        assert.equal(await splitElement.getCssValue(WHProperty), "10px");
    });

    it('should change splitter class name', async () => {
        await driver.executeScript(`window.changeSplitterClassName(\"${ORIENTATION}\", \"testClassName\")`);

        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const className = (await splitElement.getAttribute("class"));
        assert.isTrue(className.includes("testClassName"));
    });

    it('should call start and end handlers when splitter clicking', async () => {
        await driver.executeScript(`window.setDragHandlers(\"${ORIENTATION}\")`);

        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        await splitElement.click();
        const capabilities = await driver.getCapabilities();
        //fixme
        if (capabilities.getBrowserName() !== "firefox") {
            const clickLogs = await driver.manage().logs().get(logging.Type.BROWSER);
            assert.isTrue((clickLogs as any)[0].message.includes("onDragStart"));
            assert.isTrue((clickLogs as any)[clickLogs.length - 1].message.includes("onDragEnd"));
        }
    });

    it('should call start and end handlers when splitter element mouse holding', async () => {
        await driver.executeScript("console.clear();");
        const actions = driver.actions({async: true});
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        await actions.move({origin: splitElement}).press().perform();
        await actions.move({origin: splitElement}).release().perform();

        const capabilities = await driver.getCapabilities();
        //fixme
        if (capabilities.getBrowserName() !== "firefox") {
            const clickLogs = await driver.manage().logs().get(logging.Type.BROWSER);
            assert.isTrue((clickLogs as any)[0].message.includes("onDragStart"));
            assert.isTrue((clickLogs as any)[clickLogs.length - 1].message.includes("onDragEnd"));
        }
    });

    it('should call all handlers when splitter moving', async () => {
        await driver.executeScript("console.clear();");

        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const capabilities = await driver.getCapabilities();

        const actions = driver.actions({async: true});
        //move left-top
        if (ORIENTATION === "horizontal") {
            await actions.dragAndDrop(splitElement, {x: 100, y: 0}).perform();
        } else {
            await actions.dragAndDrop(splitElement, {x: 0, y: 100}).perform();
        }
        //fixme
        if (capabilities.getBrowserName() !== "firefox") {
            const complexLogs = await driver.manage().logs().get(logging.Type.BROWSER);
            assert.isTrue((complexLogs as any)[0].message.includes("onDragStart"));
            assert.isTrue((complexLogs as any)[1].message.includes("dragging"));
            assert.isTrue((complexLogs as any)[complexLogs.length - 1].message.includes("onDragEnd"));

        }

        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        const parentElementSize = await parentElement.getRect();
        const firstElementSize = await firstElement.getRect();
        const secondElementSize = await secondElement.getRect();
        assert.equal(firstElementSize[WHProperty], (parentElementSize[WHProperty] / 2) - DEFAULT_SPLITTER_SIZE + 100);
        assert.equal(secondElementSize[WHProperty], (parentElementSize[WHProperty] / 2) - 100);

    });

    it('should call collapse button and collapse then expand splitter', async () => {
        await driver.executeScript(`window.setDisableCollapse(\"${ORIENTATION}\", false)`);

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        let parentElementSize = await parentElement.getRect();
        let firstElementSize = await firstElement.getRect();
        let splitElementSize = await splitElement.getRect();
        let secondElementSize = await secondElement.getRect();

        assert.equal(Math.round(parentElementSize[WHProperty]), DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], 0);
        assert.equal(Math.round(splitElementSize[WHProperty]), DEFAULT_SPLITTER_SIZE);
        assert.equal(Math.round(secondElementSize[WHProperty]), DEFAULT_SIZE - DEFAULT_SPLITTER_SIZE);
        assert.equal(Math.round(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty]), DEFAULT_SIZE);

        await splitButtonElement.click();

        parentElementSize = await parentElement.getRect();
        firstElementSize = await firstElement.getRect();
        splitElementSize = await splitElement.getRect();
        secondElementSize = await secondElement.getRect();

        assert.equal(parentElementSize[WHProperty], DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], parentElementSize[WHProperty] / 2 - DEFAULT_SPLITTER_SIZE);
        assert.equal(splitElementSize[WHProperty], DEFAULT_SPLITTER_SIZE);
        assert.equal(secondElementSize[WHProperty], parentElementSize[WHProperty] / 2);
        assert.equal(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty], DEFAULT_SIZE);
    });

    it('should not call collapse button', async () => {
        await driver.executeScript(`window.setDisableCollapse(\"${ORIENTATION}\", true)`);
        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        let parentElementSize = await parentElement.getRect();
        let firstElementSize = await firstElement.getRect();
        let splitElementSize = await splitElement.getRect();
        let secondElementSize = await secondElement.getRect();
        assert.equal(parentElementSize[WHProperty], DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], parentElementSize[WHProperty] / 2 - DEFAULT_SPLITTER_SIZE);
        assert.equal(splitElementSize[WHProperty], DEFAULT_SPLITTER_SIZE);
        assert.equal(secondElementSize[WHProperty], parentElementSize[WHProperty] / 2);
        assert.equal(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty], DEFAULT_SIZE);

    });

    it('should element be collapsed on start', async () => {
        await driver.executeScript(`window.setCollapsedOnStart(\"${ORIENTATION}\", true)`);

        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        let parentElementSize = await parentElement.getRect();
        let firstElementSize = await firstElement.getRect();
        let splitElementSize = await splitElement.getRect();
        let secondElementSize = await secondElement.getRect();

        assert.equal(Math.round(parentElementSize[WHProperty]), DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], 0);
        assert.equal(Math.round(splitElementSize[WHProperty]), DEFAULT_SPLITTER_SIZE);
        assert.equal(Math.round(secondElementSize[WHProperty]), DEFAULT_SIZE - DEFAULT_SPLITTER_SIZE);
        assert.equal(Math.round(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty]), DEFAULT_SIZE);

    });

    it('should call custom click handler on splitter button and no move split element', async () => {
        await driver.executeScript(`window.setOnSplitButtonClick(\"${ORIENTATION}\")`);
        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();
        const capabilities = await driver.getCapabilities();
        //fixme
        if (capabilities.getBrowserName() !== "firefox") {
            const clickLogs = await driver.manage().logs().get(logging.Type.BROWSER);
            assert.isTrue((clickLogs as any)[0].message.includes("onSplitButtonClick"));
        }
        const parentElement = await driver.findElement(By.css(PARENT_ELEMENT_SELECTOR));
        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        let parentElementSize = await parentElement.getRect();
        let firstElementSize = await firstElement.getRect();
        let splitElementSize = await splitElement.getRect();
        let secondElementSize = await secondElement.getRect();
        assert.equal(parentElementSize[WHProperty], DEFAULT_SIZE);
        assert.equal(firstElementSize[WHProperty], parentElementSize[WHProperty] / 2 - DEFAULT_SPLITTER_SIZE);
        assert.equal(splitElementSize[WHProperty], DEFAULT_SPLITTER_SIZE);
        assert.equal(secondElementSize[WHProperty], parentElementSize[WHProperty] / 2);
        assert.equal(firstElementSize[WHProperty] + splitElementSize[WHProperty] + secondElementSize[WHProperty], DEFAULT_SIZE);

    });

    it('should create collapsable element when collapse mode === replace', async () => {
        await driver.executeScript(`window.setCollapseMode(\"${ORIENTATION}\", \"replace\")`);
        const collapsePlugElement = await driver.findElement(By.css(".collapse-plug"));

        assert.isTrue(await collapsePlugElement.isEnabled());
        assert.equal(await collapsePlugElement.getCssValue("display"), "none");

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        assert.equal(await collapsePlugElement.getCssValue("display"), "flex");

    });

    it('should splitter be displayed after collapse element', async () => {
        await driver.executeScript(`window.setHideSplitterOnCollapse(\"${ORIENTATION}\", \"replace\", false)`);
        const collapsePlugElement = await driver.findElement(By.css(".collapse-plug"));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));

        assert.isTrue(await collapsePlugElement.isEnabled());
        assert.isTrue(await splitElement.isEnabled());
        assert.equal(await collapsePlugElement.getCssValue("display"), "none");
        assert.equal(await splitElement.getCssValue("display"), "flex");

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        assert.equal(await collapsePlugElement.getCssValue("display"), "flex");
        assert.equal(await splitElement.getCssValue("display"), "flex");
    });

    it('should splitter not be displayed after collapse element', async () => {
        await driver.executeScript(`window.setHideSplitterOnCollapse(\"${ORIENTATION}\", \"replace\", true)`);
        const collapsePlugElement = await driver.findElement(By.css(".collapse-plug"));
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));

        assert.isTrue(await collapsePlugElement.isEnabled());
        assert.isTrue(await splitElement.isEnabled());
        assert.equal(await collapsePlugElement.getCssValue("display"), "none");
        assert.equal(await splitElement.getCssValue("display"), "flex");

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        assert.equal(await collapsePlugElement.getCssValue("display"), "flex");
        assert.equal(await splitElement.getCssValue("display"), "none");
    });

    it('should splitter be displayed after collapse element, plug be not', async () => {
        await driver.executeScript(`window.setHideSplitterOnCollapse(\"${ORIENTATION}\", \"collapse\", false)`);
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));

        assert.isTrue(await splitElement.isEnabled());
        assert.equal(await splitElement.getCssValue("display"), "flex");

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        assert.equal(await splitElement.getCssValue("display"), "flex");
    });

    it('should splitter not be displayed after collapse element, plug be not', async () => {
        await driver.executeScript(`window.setHideSplitterOnCollapse(\"${ORIENTATION}\", \"collapse\", true)`);
        const splitElement = await driver.findElement(By.css(SPLIT_ELEMENT_SELECTOR));

        assert.isTrue(await splitElement.isEnabled());
        assert.equal(await splitElement.getCssValue("display"), "flex");

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        assert.equal(await splitElement.getCssValue("display"), "none");
    });

    it('should splitter not be displayed after collapse element, plug be not', async () => {
        await driver.executeScript(`window.setCollapsedCaption(\"${ORIENTATION}\")`);
        const collapsePlugElement = await driver.findElement(By.css(".collapse-plug"));
        const collapsePlugCaptionElement = await driver.findElement(By.css(".collapse-plug .caption"));

        assert.isTrue(await collapsePlugElement.isEnabled());
        assert.isTrue(await collapsePlugCaptionElement.isEnabled());
        assert.equal(await collapsePlugElement.getCssValue("display"), "none");

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();

        assert.equal(await collapsePlugElement.getCssValue("display"), "flex");
        assert.equal(await collapsePlugCaptionElement.getText(), "testCaption");
    });

    it('should splitter collapse to left/bottom after click', async () => {
        await driver.executeScript(`window.setChangeDirection(\"${ORIENTATION}\", \"reverse\")`);

        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`);

        const splitButtonElement = await driver.findElement(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        await splitButtonElement.click();
        assert.equal(await secondElement.getCssValue(WHProperty), "0px");

        await splitButtonElement.click();
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`);
    });

    it('should split button not be rendered', async () => {
        await driver.executeScript(`window.setHideSplitButton(\"${ORIENTATION}\")`);
        const splitElementButton = await driver.findElements(By.css(`${SPLIT_ELEMENT_SELECTOR} .split-button`));
        assert.equal(splitElementButton.length, 0);
    });

    it('should change orientation after change orientation callback collapse, then change again', async () => {
        await driver.executeScript(`window.setFunctionsToWindow(\"${ORIENTATION}\")`);
        let splitterObject: any = await driver.executeScript("function getSplitter() {return window.splitter};return getSplitter()");

        assert.isTrue(typeof splitterObject === "object");
        assert.isTrue(splitterObject.orientation === ORIENTATION);

        await driver.executeScript("window.changeOrientation()");

        splitterObject = await driver.executeScript("function getSplitter() {return window.splitter};return getSplitter()");

        assert.isTrue(typeof splitterObject === "object");
        assert.isFalse(splitterObject.orientation === ORIENTATION);

        await driver.executeScript("window.changeOrientation()");

        splitterObject = await driver.executeScript("function getSplitter() {return window.splitter};return getSplitter()");

        assert.isTrue(typeof splitterObject === "object");
        assert.isTrue(splitterObject.orientation === ORIENTATION);
    });


    it('should collapse after using callback collapse, then expand', async () => {
        await driver.executeScript(`window.setFunctionsToWindow(\"${ORIENTATION}\")`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2 - DEFAULT_SPLITTER_SIZE}px`, "first before click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`, "second before click");

        assert.equal(await firstElement.getCssValue(minWHProperty), "auto", "first before click");
        assert.equal(await secondElement.getCssValue(minWHProperty), "auto", "second before click");

        await driver.executeScript("window.collapse()");

        assert.equal(await firstElement.getCssValue(WHProperty), "0px", "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE - DEFAULT_SPLITTER_SIZE}px`, "second after click");

        assert.equal(await firstElement.getCssValue(minWHProperty), "auto", "first before click");
        assert.equal(await secondElement.getCssValue(minWHProperty), "auto", "second before click");


        await driver.executeScript("window.expand()");

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2 - DEFAULT_SPLITTER_SIZE}px`, "first after expand");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`, "second after expand");

        assert.equal(await firstElement.getCssValue(minWHProperty), "auto", "first after expand");
        assert.equal(await secondElement.getCssValue(minWHProperty), "auto", "second after expand");

    });

    it('should set correct sizes after click on setSizes callback', async () => {
        await driver.executeScript(`window.setFunctionsToWindow(\"${ORIENTATION}\")`);

        const firstElement = await driver.findElement(By.css(FIRST_ELEMENT_SELECTOR));
        const secondElement = await driver.findElement(By.css(SECOND_ELEMENT_SELECTOR));

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2 - DEFAULT_SPLITTER_SIZE}px`, "first before click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`, "second before click");

        await driver.executeScript("window.setSizes([\"20%\", \"80%\"])");

        assert.equal(await firstElement.getCssValue(WHProperty), `${(DEFAULT_SIZE / 100 * 20) - DEFAULT_SPLITTER_SIZE}px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 100 * 80}px`, "second after click");

        await driver.executeScript("window.setSizes([\"10%\", \"90%\"])");

        assert.equal(await firstElement.getCssValue(WHProperty), `${(DEFAULT_SIZE / 100 * 10) - DEFAULT_SPLITTER_SIZE}px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 100 * 90}px`, "second after click");

        await driver.executeScript("window.setSizes([])");

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2 - DEFAULT_SPLITTER_SIZE}px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`, "second after click");

        await driver.executeScript("window.setSizes()");

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2 - DEFAULT_SPLITTER_SIZE}px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE / 2}px`, "second after click");

        await driver.executeScript("window.setSizes([\"0px\"])");

        assert.equal(await firstElement.getCssValue(WHProperty), `0px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE - DEFAULT_SPLITTER_SIZE}px`, "second after click");

        await driver.executeScript("window.setSizes([\"100px\"])");

        assert.equal(await firstElement.getCssValue(WHProperty), `${100 - DEFAULT_SPLITTER_SIZE}px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `${DEFAULT_SIZE - 100}px`, "second after click");

        await driver.executeScript("window.setSizes([null, \"100px\"])");

        assert.equal(await firstElement.getCssValue(WHProperty), `${DEFAULT_SIZE - 100 - DEFAULT_SPLITTER_SIZE}px`, "first after click");
        assert.equal(await secondElement.getCssValue(WHProperty), `100px`, "second after click");
    });

    after(async () => {
        await driver.quit();
    });

});