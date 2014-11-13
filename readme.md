# SimpleSim

> **Alpha** - Tested on OS X only, with working Xcode and Android configurations. Not tested on Windows, or in the absence of Xcode/Android environments. Use at your own peril! :-) Kidding, please open an issue if you have a problem with it.

Simplifies launching Titanium apps to the simulator/emulator by allowing the use of aliases rather than UDIDs / emulator names.

Turns this:

```shell
ti build -p ios -C 779CA28E-FE7D-4B2F-AF49-48CBCBC7B8D5
```

Into this:

```shell
ti build -p ios -C ipad_2
```

Generically:

```shell
ti build -p <platform> -C <alias>
```

You can even ommit the platform and SimpleSim will try to detect it based on the emulator/simulator
```shell
ti build -C <alias>
```



## Setup

Install from NPM or clone the repo and install from your local directory.

```shell
# preferred
[sudo] npm install -g simplesim

# or non-globally
npm install simplesim

# generate the aliases and install the CLI plug-in
# if installed globally
simplesim generate

# if installed non-globally
node <install_dir>/index.js generate
```

The list of device aliases is saved to the ~/.titanium/simplesim.json file. You're welcome to edit that file to create custom or more mnemonic aliases. But keep in mind that you will need to <span style="color:red;">**update the aliases list every time you update Xcode or add/remove an Android AVD**</span> which will overwrite any customizations you make.

## Usage

Commands:

```shell
// get help output
simplesim
simplesim -h
simplesim --help

// generate the list of aliases and install the CLI plug-in
simplesim generate
simplesim -g
simplesim --generate-aliases

// list the aliases without rebuilding
simplesim list
simplesim --list
simplesim -l

// get version info
simplesim --version
simplesim -v
```

## Uninstalling SimpleSim

To uninstall SimpleSim:

```shell
# First, remove the CLI hook and config file
simplesim uninstall

# Second, remove SimpleSim itself
sudo npm r -g simplesim
```

Manual method:

1. Edit your USERHOME/.titanium/config.json file. In the "hooks" section, delete the line referencing the simplesim/hooks folder and the comma at the end of the preceding line.
2. Delete the USERHOME/.titanium/simplesim.json file.
3. Uninstall the module using `npm r` as shown above.


# How it works

SimpleSim has two parts: a script to build a list of aliases for UDIDs / AVD names, and a CLI plug-in. The alias-building script uses the `ti info` command to retrieve the details from your Titanium configuration. It parses the results and writes them to a JSON file in the .titanium folder in your home directory.

The CLI plug-in hooks into the CLI at the `cli:go` step, which is before the CLI arguments are parsed. It looks for the required `-C` (or `--device-id`) argument. If found, it looks up the argument's value in the JSON file. If there's a match, that's substituted for the original value of the argument and the build proceeds. If there's not a match (like if you entered an actual UDID), SimpleSim gives up and the build procees.

# Changelog

* 0.0.2 - Initial NPM release
* 0.0.3 - Resolve stack error (issue #1), added uninstall command, change to hook path
* 0.0.4 - Autodetect build platform (PR#5), issue #4 (invalid array length), issue #3 (duplicate sim names w/ multiple iOS versions present)
