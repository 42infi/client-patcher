# Patcher
Tool for injecting Sploit into Krunker clients

[Source](src)

## Installation:

1. Download the [standalone executable](https://github.com/y9x/client-patcher/releases/download/1.0.2/Patcher.exe)
2. Open Patcher.exe and wait 1-2 seconds then a window and a list of clients will show

## Usage:

1. Click on the icon to a Krunker client you want to patch
(If you cannot find the client's icon, you can manually add it by pressing the + button)

2. Make sure the client is closed, if not press the stop button
3. Press "Patch" and it will take a few seconds
(If you get an error, close the patcher and right click Patcher.exe and press run as administrator)

4. If everything was successful, you will see "Patched: Yes" in the client info
5. Press "Play" to start the client

## Unpatching:

1. Click on the client to unpatch
2. Press "Unpatch"

## Building the patcher:

1. Clone this repository
`git clone https://github.com/e9x/kru.git`

2. Enter the patcher folder
`cd e9x/patcher`

3. Install dependencies
`./!INSTALL_MODULES.cmd`

4. Test the app
`./!TEST_PATCHER.cmd`

5. Build the binaries
`./!BUILD_EXE.cmd`

Output is found in the `src/dist/` folder
