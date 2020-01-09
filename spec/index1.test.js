const rawTests = require("./index_raw");
const util = require("../src/util");
const docker = require("../src/docker");

util.setConfig({ useDocker: true });
if (!docker.findDockerId()) throw new Error("Docker not yet started");
describe("docker test suite", () => rawTests.run());
