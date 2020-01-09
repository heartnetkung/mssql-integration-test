const { cosmiconfigSync } = require("cosmiconfig");
const { join } = require("path");
const { execSync } = require("child_process");

const DEFAULT_CONFIG = {
	user: "SA",
	password: "yourStrong(!)Password",
	useDocker: false,
	sqlDumpPath: null,
	sqlDataPath: null
};

exports.execute = async (pool, sql) => {
	var ans = await pool.request().query(sql);
	return ans.recordset || ans;
};

var config = null;
exports.getConfig = () => {
	if (!config) config = DEFAULT_CONFIG;
	return config;
};

exports.setConfig = newConfig => {
	if (config)
		throw new Error(
			"setConfig() must be called before the first getConfig()"
		);
	config = {};
	for (var c in DEFAULT_CONFIG)
		config[c] =
			newConfig[c] === undefined ? DEFAULT_CONFIG[c] : newConfig[c];
};

exports.execCmd = cmd => {
	var out = execSync(cmd);
	if (typeof out !== "string") out = out.toString();
	return out;
};
