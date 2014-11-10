/*// check that the CLI is installed as required
try {
	console.log(require.resolve('titanium') + ' is installed, proceeding...');
} catch(e) {
	console.error('The Titanium CLI is not installed. Please install with `[sudo] npm install -g titanium`');
	process.exit(e.code);
}
*/
var _ = require('underscore')._,
	async = require('async'),
	colors = require('colors'),
	exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	child,
	config = {
		version: require('./package.json').version,
		emulators: [],
		simulators: [],
	},
	tiinfo,
	titaniumConfigFolder = path.resolve(getUserHome(), ".titanium"),
	configFile = path.join(titaniumConfigFolder, 'simplesim.json');

async.series([getAndroidEmulators, getiOSSimulators], done);


function getAndroidEmulators(done) {
	// For all platforms, check for Android emulators
	exec('ti info -t android -o json --no-banner --no-progress-bars --no-colors',
		function (error, stdout, stderr) {
			if(error) {
				throw error;
			} else {
				tiinfo = JSON.parse(stdout);
				_.each(tiinfo.android.emulators, function(emu) {
					config.emulators.push({
						name: (emu.device) ? emu.device : emu.name,
						alias: (emu.type==='avd') ? emu.name.replace(/\./g, "_") : "geny_" + ((emu["api-level"]) ? emu["api-level"] + "_" : "") + emu.target.replace(/\./g, "_"),
						udid: emu.name
					});
				});
				done();
			}
	});
}

function getiOSSimulators(done) {
	// For OS X, check for iOS simulators
	if(process.platform === 'darwin') {
		exec('ti info -t ios -o json --no-banner --no-progress-bars --no-colors',
			function (error, stdout, stderr) {
				if(error) {
					throw error;
				} else {
					tiinfo = JSON.parse(stdout);
					_.each(tiinfo.ios.simulators, function(ver) {
						_.each(ver, function(sim) {
							config.simulators.push({
								name: sim.name,
								alias: sim.name.replace(/\s/g, "_").toLowerCase(),
								udid: sim.udid
							});
						});
					});
				done();
				}
		});
	}
}

function done() {
	banner();
	save();
	summary();
}

function banner() {
	console.log('*******************************************************************'.cyan);
	console.log('* SimpleSim - simplified app launching for Titanium turns this    *'.cyan);
	console.log('*      ti build -p ios -C 779CA28E-FE7D-4B2F-AF49-48CBCBC7B8D5    *'.cyan)
	console.log('* into this                                                       *'.cyan);
	console.log('*      ti build -p ios -C ipad_2                                  *'.cyan)
	console.log('* Generically:                                                    *'.cyan);
	console.log('*      '.cyan + 'ti build -p <platform> -C <alias>'.yellow + '                          *'.cyan)
	console.log('*******************************************************************\n'.cyan);
}

function save() {
	try {
		if (!fs.existsSync(titaniumConfigFolder)) {
			wrench.mkdirSyncRecursive(titaniumConfigFolder);
		}
		var tmpFile = configFile + '.' + Date.now() + '.tmp';
		fs.writeFileSync(tmpFile, JSON.stringify(config, null, '\t'));
		fs.renameSync(tmpFile, configFile);
	} catch (e) {
		if (e.code == 'EACCES') {
			console.error(__('Unable to write config file %s', configFile));
			console.error(__('Please ensure that SimpleSim has access to modify this file.') + '\n');
		} else {
			console.error(__('An error occurred trying to save the SimpleSim config file.'));
			console.error((e.stack || e.toString()) + '\n');
		}
		process.exit(1);
	}
}

function summary() {
	console.log("Emulator aliases (full name):".yellow);
	_.each(config.emulators, function(emu) {
		console.log("   " + emu.alias + spacer(emu.alias, 20) + emu.name);
	});
	if(config.simulators.length) {
		console.log("\nSimulator aliases (full name - UDID):".yellow);
		_.each(config.simulators, function(sim) {
			console.log("   " + sim.alias + spacer(sim.alias, 20) + sim.name + spacer(sim.name, 15) + "(" + sim.udid + ")");
		});
	}
}

function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function spacer(str, col2) {
	if(!col2) col2 = 20;
	if(col2 - str.length <= 1) { col2 += 5; }
	return (new Array(col2 - str.length || 0)).join(' ');
}