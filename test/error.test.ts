import {describe, it} from "mocha";
import {assert} from "chai";
import {split} from "../src/ts/index";

const NO_SELECTOR_ERROR = "Both or one selector was not passed";
describe('error handling testing', function () {
    it('should return error without any sending parameters ', () => {
        assert.throws(() => {
            // @ts-ignore
            split()
        }, NO_SELECTOR_ERROR)
    });
    it('should return error with empty selectors array', () => {
        assert.throws(() => {
            // @ts-ignore
            split([])
        }, NO_SELECTOR_ERROR)
    });
    it('should return error with only one selector', () => {
        assert.throws(() => {
            // @ts-ignore
            split(["#one"])
        }, NO_SELECTOR_ERROR)
    });
    it('should return error with only one selector', () => {
        assert.throws(() => {
            // @ts-ignore
            split([null, "#two"])
        }, NO_SELECTOR_ERROR)
    });
    it('should throw document is not defined', () => {
        assert.throws(() => {
            // @ts-ignore
            split(["#one", "#two"])
        }, "document is not defined")
    });
});