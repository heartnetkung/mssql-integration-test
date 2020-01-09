const getAllFuncs = obj => {
	var props = [];
	var realObj = obj;
	do {
		props = props.concat(Object.getOwnPropertyNames(obj));
	} while ((obj = Object.getPrototypeOf(obj)));
	return props.sort().filter((e, i, arr) => {
		if (e[0] === "_") return false;
		if (e != arr[i + 1] && typeof realObj[e] == "function") return true;
	});
};

const wrapFunction = name => {
	return function() {
		return this._realObj[name].apply(this._realObj, arguments);
	};
};

module.exports = obj => {
	var ans = { _realObj: obj };
	for (var funcName of getAllFuncs(obj))
		ans[funcName] = wrapFunction(funcName);
	return ans;
};
