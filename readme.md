# SimpleSim

**Alpha - Unstable** - Use at your own peril! :-)

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

## Setup

For now, clone the repo, then from the simplesim directory:

```shell
npm install .
```

Then, enable aliases:

```shell
node ./index.js
```

That will output a list of aliases -- iOS simulators and Android emulators. They're hopefully obvious and intuitive.

