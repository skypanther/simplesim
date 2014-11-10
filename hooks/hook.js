var _ = require('underscore')._,
	fs = require('fs'),
	path = require('path'),
	configFile = path.join(getUserHome(), ".titanium", 'simplesim.json'),
	index,
	platforms = {
		ios: "simulators",
		android: "emulators"
	},
	sim,
	simplesim;

exports.cliVersion = ">=3.4";
exports.init = function (logger, config, cli, nodeappc) {
	cli.on("cli:go", function () {
		if(!fs.existsSync(configFile)) {
			console.warn('[WARN] SimpleSim configuration file missing, re-run simplesim.');
			return;
		}
		simplesim = require(configFile);
		if(cli && cli.globalContext && cli.globalContext.argv) {
			if(!cli.globalContext.argv.p) { return; }
			if(!cli.globalContext.argv.C) { return; }
			// grab the right sim/emu
			sim = _.where(simplesim[platforms[cli.globalContext.argv.p]], { alias: cli.globalContext.argv.C});
			if(!sim || sim.length === 0) { return; }
			if(cli.argv.$_.indexOf(cli.globalContext.argv.C) === -1) { return; }
			cli.argv.$_[cli.argv.$_.indexOf(cli.globalContext.argv.C)] = sim[0].udid;
			cli.globalContext.argv.C = sim[0].udid;
		}
	});
};

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
