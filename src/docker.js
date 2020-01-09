const { getConfig, execCmd } = require("./util");
const os = require("os");

exports.startDocker = source => {
	var password = getConfig().password;
	var dockerCmd = `docker run -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=${password}' -e 'MSSQL_PID=Express' -p 1433:1433 -d mcr.microsoft.com/mssql/server:2017-latest`;
	if (os.platform() === "win32") dockerCmd = dockerCmd.replace(/'/g, '"');
	execCmd(dockerCmd);
	execCmd(`docker cp ${source} ${findDockerId()}:/tmp/dump.bak`);
};

exports.stopDocker = () => {
	var dockerId = findDockerId();
	if (dockerId) execCmd(`docker stop ${dockerId}`);
};

exports.copyBackupFileFromDocker = destination =>
	execCmd(`docker cp ${findDockerId()}:/tmp/dump.bak ${destination}`);

exports.findDockerIp = () => {
	try {
		var out = execCmd("docker network inspect bridge");
		var ans = JSON.parse(out);
		try {
			var gateway = ans.IPAM.Config[0].Gateway;
			if (typeof gateway === "string") return gateway;
		} catch (e) {}
		//config not found
		return "127.0.0.1";
	} catch (e) {
		throw new Error("docker network inspect bridge failed");
	}
};

const findDockerId = () => {
	try {
		var out = execCmd("docker ps");
	} catch (e) {
		throw new Error("Docker not installed.");
	}

	var dockerIds = [];
	var regexp = /\n(\S+).+mcr\.microsoft\.com\/mssql/gi;
	out.replace(regexp, (m, p1) => dockerIds.push(p1));
	if (dockerIds.length > 1)
		throw new Error(
			"Multiple sql server found. Stop the rest then proceed."
		);
	return dockerIds[0];
};

exports.findDockerId = findDockerId;
