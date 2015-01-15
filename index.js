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
	hooksFolder = path.join(path.dirname(__filename), 'hooks'),
	maxIosVersion,
	suffix = '',
	tiinfo,
	titaniumConfigFolder = path.resolve(getUserHome(), ".titanium"),
	configFile = path.join(titaniumConfigFolder, 'simplesim.json');

var commonNames = {
	's2 ': 's2',
	's3 ': 's3',
	's4 ': 's4',
	's5 ': 's5',
	'galaxy nexus': 'gnex',
	'nexus one': 'nexusone',
	'nexus s': 'nexuss',
	'galaxy tab': 'gtab',
	'samsung note': 'note',
	'motorola moto g': 'motog',
	'motorola razr': 'razr',
	'motorola droid': 'droid'
}

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
	case 'uninstall':
		exec('ti config -r paths.hooks ' + hooksFolder);
		removeConfigFile();
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
						alias: makeAlias(emu),
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
						if(!maxIosVersion) {
							maxIosVersion = ver;
						} else if(ver < maxIosVersion) {
							suffix = '_' + ver.replace(/\./g, '');
						}
						_.each(ver, function(sim) {
							config.simulators.push({
								name: sim.name,
								alias: sim.name.replace(/\s/g, "").toLowerCase() + suffix,
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
	console.log('*      ti build -p ios -C ipad2                                   *'.cyan)
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
	console.log("Emulator aliases     Full name".yellow);
	_.each(config.emulators, function(emu) {
		console.log(emu.alias + spacer(emu.alias, 22) + emu.name);
	});
	if(config.simulators.length) {
		console.log("\nSimulator aliases    Full name         (UDID)".yellow);
		_.each(config.simulators, function(sim) {
			console.log(sim.alias + spacer(sim.alias, 22) + sim.name + spacer(sim.name, 19) + "(" + sim.udid + ")");
		});
	}
}

function removeConfigFile() {
	// remove the config file
	fs.exists(configFile, function (exists) {
		if(exists) {
			fs.unlink(configFile, function(err) {
				if(err) {
					console.error('Unable to remove the SimpleSim aliases file'.red);
					if(err.errno === 3) {
						console.error('SimpleSim uninstall does not have permissions to remove the alias file'.red);
					}
						console.error('Please delete ' + configFile + ' manually.'.red)
				} else {
					console.log('SimpleSim: alias file removed');
				}
			})
		}
	});
}

// a couple of helper functions
function getUserHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function spacer(str, col2) {
	if(!col2) col2 = 20;
	while(col2 - str.length <=1) {
		col2 += 3;
	}
	return (new Array(col2 - str.length || 0)).join(' ');
}

function makeAlias(emu) {
	if(typeof emu !== 'object' || !emu.type) {
		console.error('Invalid emulator type. Is your Android environment configured correctly?'.red);
		process.exit(1);
	}
	var type = 'avd_',
		found,
		version = ((emu["sdk-version"]) ? emu['sdk-version'].replace(/\./g, "") : emu.target.replace(/\./g, ""));
	if(emu.type === 'avd') {
		found = emu.name.match(/s\d\s|Galaxy\sNexus|Nexus(\s{1}\w*)*|Motorola(\s{1}\w*)*/i);
		if(!found) {
			// probably a Ti-generated avd in form titanium_10_WVGA854_armeabi-v7a
			found = [emu.id];
		}
	} else {
		type = 'geny_';
		found = emu.name.match(/s\d\s|Galaxy\sNexus|Nexus(\s{1}\w*)*|Motorola(\s{1}\w*)*/i);
	}
	if(process.argv.slice(2)[1] === '--no-prefix') {
		type = '';
	}
console.log(found)
	if(found) {
		if(commonNames[found[0].toLowerCase()]) {
			return type + commonNames[found[0].toLowerCase()] + '_' + version;
		} else if(found[0].indexOf('titanium') !== -1) {
			//titanium_14_WVGA854_armeabi-v7a
			var tiavd = found[0].split('_');
			return 'ti' + tiavd[1] + tiavd[2] + (tiavd[3] && tiavd[3].indexOf('arm')!==-1 ? 'arm' : tiavd[3] || '');
//			return found[0].replace('titanium', 'ti').replace('')
//			return 'ti' + emu['api-level'] + (emu.skin || '');
		} else {
			return type + found[0].replace(/\.|\s*/g, "_") + '_' + version;
		}

	} else {
		return type + emu.name.split(' ')[0] + '_' + version
	}
}
