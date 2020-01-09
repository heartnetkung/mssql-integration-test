const rawTests = require("./index_raw");
const util = require("../src/util");

util.setConfig({ useDocker: false });
describe("local test suite", () => rawTests.run());
