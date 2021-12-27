'use strict';
// in MAIN process

var os = require('os'),
	fs = require('fs'),
	path = require('path'),
	electron = require('electron'),
	fetch = require('./fetch'),
	is_host = (url, ...hosts) => hosts.some(host => url.hostname == host || url.hostname.endsWith('.' + host)),
	protocol = 'k' + (Math.random() + '').substr(2);

electron.protocol.registerSchemesAsPrivileged([ { scheme: protocol, privileges: { bypassCSP: true } } ]);

electron.app.on('ready', () => {
	electron.protocol.registerBufferProtocol(protocol, async (request, callback) => {
		var url = new URL('https' + request.url.substr(protocol.length));
		
		var res = await fetch(url, {
				headers: request.headers,
				method: request.method,
				body: request.body,
			}),
			data = await res.buffer();
		
		var inject = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
		
		callback({
			mimeType: res.headers.get('content-type'),
			data: Buffer.concat([ data, Buffer.from(`;{${inject}}`) ]),
		});
	});
	
	var listener = {};
	
	electron.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
		var url = new URL(details.url);
		
		if(url.protocol == 'https:' && (url.host == 'krunker.io' || url.host.endsWith('.krunker.io')) && url.pathname == '/libs/zip.js')return callback({ cancel: false, redirectURL: `${protocol}:${url.href.substr(url.protocol.length)}` });
		
		if(typeof listener.callback == 'function'){
			if(typeof listener.filter == 'object' && Array.isArray(listener.filter.urls)){
				for(let filter of listener.filter.urls){
					filter = filter.replace(/[*[\]()$^./\\]/g, '\\$&');
					filter = filter.replace(/\\\*\\./g, '(.*?\.)?');
					filter = filter.replace(/\\\*/g, '.*?');

					try{
						let regex = new RegExp(filter);
						if(!details.url.match(filter))return callback({});
						else return listener.callback(details, callback);
					}catch(err){
						console.error(filter, 'Error creating regex:', err);
					}
				}
			}
		}

		callback({});
	});
	
	electron.session.defaultSession.webRequest.onBeforeRequest = (a1, a2) => {
		if(typeof a1 == 'function'){
			listener.callback = a1;
		}else{
			listener.callback = a2;
			listener.filter = a1;
		}
	};
	
});

// load main file
require('../' + require('./main.json'));