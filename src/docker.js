const { execSync } = require("child_process");
const { db } = require("../config");

exports.startDocker = () => {
	execCmd(
		`docker run -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=${db.password}' -e 'MSSQL_PID=Express' -p 1433:1433 -d mcr.microsoft.com/mssql/server`
	);
	execCmd(`docker cp ${source} ${findDockerId()}:/tmp/dump.bak`);
};

exports.stopDocker = () => execCmd(`docker stop ${findDockerId()}`);

exports.copyBackupFileFromDocker = destination =>
	execCmd(`docker cp ${findDockerId()}:/tmp/dump.bak ${destination}`);

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
	if (!dockerIds.length)
		throw new Error(
			"Docker not started. Try 'mssql-integration-test start'"
		);
	return dockerIds[0];
};

const execCmd = cmd => {
	var out = execSync(cmd);
	if (typeof out !== "string") out = out.toString();
	return out;
};

exports.findDockerId = findDockerId;
