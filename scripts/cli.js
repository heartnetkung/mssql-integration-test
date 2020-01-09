#!/usr/bin/env node
const program = require("commander");
const docker = require("../src/docker");
const package = require("../package.json");
const util = require("../src/util");
const fs = require("fs");
const database = require("../src/database");
const index = require("../src/index");

program.constructor.prototype.addOption = function() {
	return this.option("-d, --use-docker")
		.option("-u, --user <database-user>")
		.option("-p, --password <database-password>")
		.option("-s, --server <ip>")
		.option("-P, --port <database-port>")
		.option(
			"--sql-dump-path <dump.bak-path>",
			"you normally don't need this option"
		)
		.option(
			"--sql-data-path <sql-data-path>",
			"you normally don't need this option"
		);
};

const handleConfig = cmdObj => {
	var config = cmdObj.opts();
	util.setConfig(config);
	return config;
};

program
	.command("init <backup_file>")
	.description("initialize mssql 2017 docker and prepare backup file")
	.addOption()
	.action((backup, cmdObj) => {
		var config = handleConfig(cmdObj);
		if (!config.useDocker)
			return fs.copyFileSync(backup, database.dumpPath());
		var dockerId = docker.findDockerId();
		if (dockerId) throw new Error("Docker already started.");
		docker.startDocker(backup);
	});

program
	.command("info")
	.description("get information about the connecting SQL Server")
	.addOption()
	.action(async cmdObj => {
		try {
			handleConfig(cmdObj);
			var pool = await index.rawGetPool();
			var ans = await util.execute(pool, "select @@version");
			console.log(ans[0][""]);
			pool.close();
		} catch (e) {
			console.error(e);
		}
	});

program
	.command("backup")
	.description("initialize mssql 2017 local")
	.addOption()
	.action(cmdObj => {
		//handle
		handleConfig(cmdObj);
	});

program
	.command("stop-docker")
	.description("stop running docker if any")
	.action(docker.stopDocker);

program
	.name(package.name)
	.version(package.version)
	.on("command:*", function() {
		console.error(
			"Invalid command: %s\nSee --help for a list of available commands.",
			program.args.join(" ")
		);
		process.exit(1);
	})
	.parse(process.argv);
