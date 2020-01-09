const docker = require("../src/docker");
const { join } = require("path");
const { execCmd } = require("../src/util");
const ping = require("ping");

var dockerId;
//stop if already started
try {
	docker.stopDocker();
} catch (e) {}

it("startDocker(dump)", () => {
	dockerId = docker.findDockerId();
	expect(dockerId).toBeFalsy();

	docker.startDocker(join(__dirname, "dump.bak"));
	dockerId = docker.findDockerId();
	expect(/^[0-9a-f]{12}$/.test(dockerId)).toBeTruthy();

	var fileStat = execCmd(
		`docker exec ${dockerId} stat --format="%F" /tmp/dump.bak`
	);
	expect(fileStat.trim()).toEqual("regular file");
});

it("findDockerIp()", async () => {
	var ip = docker.findDockerIp();
	var pingResult = await ping.promise.probe(ip);
	expect(pingResult.alive).toBe(true);
});

it("stopDocker()", () => {
	docker.stopDocker();
	dockerId = docker.findDockerId();
	expect(dockerId).toBeFalsy();
});
