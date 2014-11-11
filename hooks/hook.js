var _ = require('underscore')._,
	fs = require('fs'),
	path = require('path'),
	configFile = path.join(getUserHome(), ".titanium", 'simplesim.json'),
	buildPlatform, deviceId, index,
	platforms = {
		ios: "simulators",
		android: "emulators"
	},
	sim, simplesim;

exports.cliVersion = ">=3.4";
exports.init = function (logger, config, cli, nodeappc) {
	cli.on("cli:go", function () {
		if(!fs.existsSync(configFile)) {
			logger.warn('SimpleSim configuration file missing, re-run simplesim.');
			return;
		}
		simplesim = require(configFile);
		if(cli && cli.globalContext && cli.globalContext.argv) {
			if(cli.globalContext.argv.p || cli.globalContext.argv.platform) {
				buildPlatform = cli.globalContext.argv.p || cli.globalContext.argv.platform;
			}
			if(cli.globalContext.argv.C || cli.globalContext.argv['device-id']) {
				deviceId = cli.globalContext.argv.C || cli.globalContext.argv['device-id'];
			}
			// grab the right sim/emu
			sim = _.where(simplesim[platforms[buildPlatform]], { alias: deviceId});
			if(!sim || sim.length === 0) { return; }
			if(cli.argv.$_.indexOf(deviceId) === -1) { return; }
			cli.argv.$_[cli.argv.$_.indexOf(deviceId)] = sim[0].udid;
			cli.globalContext.argv.C = sim[0].udid;
		}
	});
};

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
