#!/usr/bin/env node
const program = require("commander");
const docker = require("./docker");
const package = require("../package.json");
const util = require("./util");
const fs = require("fs");
const path = require("path");
const database = require("./database");
const index = require("./index");

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

const wait = ms =>
	new Promise(res => {
		setTimeout(res, ms);
	});

program
	.command("init <backup_file>")
	.description("initialize mssql 2017 docker and prepare backup file")
	.addOption()
	.action(async (backup, cmdObj) => {
		var config = handleConfig(cmdObj);

		if (config.useDocker) {
			var dockerId = docker.findDockerId();
			if (dockerId) throw new Error("Docker already started.");
			docker.startDocker(backup);
		} else fs.copyFileSync(backup, database.dumpPath());

		//retry until the docker/database is ready
		var pool;
		for (var i = 0; i < 10; i++)
			try {
				pool = await index.rawGetPool();
				break;
			} catch (e) {
				await wait(i * 1000);
			}

		await database.restore(pool, "_for_reset");
		if (pool) pool.close();
	});

program
	.command("info")
	.description("get information about the connecting SQL Server")
	.addOption()
	.action(async cmdObj => {
		var pool;
		try {
			handleConfig(cmdObj);
			pool = await index.rawGetPool();
			var ans = await util.execute(pool, "select @@version");
			console.log(ans[0][""]);
		} catch (e) {
			console.error(e);
		}
		if (pool) pool.close();
	});

program
	.command("backup <database_name> <destination_folder>")
	.description(
		"backup the database with the given name to the destination folder with filename dump.bak"
	)
	.addOption()
	.action(async (dbName, folder, cmdObj) => {
		var pool;
		try {
			var config = handleConfig(cmdObj);
			pool = await index.rawGetPool();
			await database.backup(pool, dbName);
			if (config.useDocker)
				return docker.copyBackupFileFromDocker(folder);
			fs.renameSync(database.dumpPath(), path.join(folder, "dump.bak"));
		} catch (e) {
			console.error(e);
		}
		if (pool) pool.close();
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
