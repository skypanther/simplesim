var _ = require('./node_modules/underscore')._,
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
	hooksFolder = path.join(path.resolve('simplesim'), '..', 'hooks'),
	tiinfo,
	titaniumConfigFolder = path.resolve(getUserHome(), ".titanium"),
	configFile = path.join(titaniumConfigFolder, 'simplesim.json');

switch(process.argv.slice(2)[0]) {
	case '-v':
	case '--version':
			console.log(require('./package.json').version);
			process.exit();
		break;
	case '-l':
	case 'list':
	case '--list':
		banner();
		summary();
		break;
	case '-a':
	case '-g':
	case 'generate':
	case '--generate-aliases':
		exec('ti config -r paths.hooks ' + hooksFolder);
		async.series([getAndroidEmulators, getiOSSimulators], done);
		break;
	case '-h':
	case '--help':
	default:
			console.log('\nSimpleSim version ' + require('./package.json').version);
			console.log('\nCreate the list of aliases with:');
			console.log('    simplesim generate'.yellow);
			console.log('Then run your project using the alias:')
			console.log('    ti build -p <platform> -C <alias>'.yellow);
			console.log('\nGet a list of aliases with:')
			console.log('    simplesim list'.yellow);
			console.log('\nFor more information, visit https://github.com/skypanther/simplesim');
}


function getAndroidEmulators(done) {
	// For all platforms, check for Android emulators
	exec('ti info -t android -o json --no-banner --no-progress-bars --no-colors', {maxBuffer: 1024 * 1024},
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
		exec('ti info -t ios -o json --no-banner --no-progress-bars --no-colors', {maxBuffer: 1024 * 1024},
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
	exec('ti config -a paths.hooks ' + hooksFolder);
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
	if(config.emulators.length === 0) {
		if (fs.existsSync(configFile)) {
			config = JSON.parse(fs.readFileSync(configFile));
		}
		else {
			console.error(('Config file not found, please ensure you run '.red+'simplesim generate'.cyan +' first.'.red) + '\n');
			process.exit(1);
		}
	}
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
