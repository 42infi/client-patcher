'use strict';
// in MAIN process

var os = require('os'),
	fs = require('fs'),
	path = require('path'),
	electron = require('electron'),
	main = require('./main.json'),
	fetch = require('./fetch'),
	log = console.log.bind(console, '[SPLOIT]'),
	is_host = (url, ...hosts) => hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host)),
	protocol = 'yendispro' + (Math.random() + '').substr(2);

log('Injected main');

electron.protocol.registerSchemesAsPrivileged([ { scheme: protocol, privileges: { bypassCSP: true } } ]);

electron.app.on('ready', () => {
	electron.protocol.registerBufferProtocol(protocol, async (request, callback) => {
		var url = new URL('https' + request.url.substr(protocol.length));
		
		log('Fetching', url);
		
		var res = await fetch(url, {
				headers: request.headers,
				method: request.method,
				body: request.body,
			}),
			data = await res.buffer();
		
		log('Reading inject');
		
		var inject = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
		
		log('Calling callback..');
		
		callback({
			mimeType: res.headers.get('content-type'),
			data: Buffer.concat([ data, Buffer.from(`;${inject}`) ]),
		});
	});
	
	electron.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
		var url = new URL(details.url);
		
		if(url.protocol == 'https:' && (url.host == 'krunker.io' || url.host.endsWith('.krunker.io')) && url.pathname == '/libs/zip.js')return callback({ cancel: false, redirectURL: `${protocol}:${url.href.substr(url.protocol.length)}` });
		
		callback(details);
	});
});

// load main file
require(path.resolve(__dirname, '..', main));