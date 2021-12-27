'use strict';

var child_process = require('child_process');

class Utils {
	static process_running(name){
		var command;
		
		switch(process.platform){
			case'win32':
				command = 'tasklist /fi ' + JSON.stringify('ImageName eq ' + name);
				break;
			case'linux':
				// does this really support linux?
				command = 'ps aux';
				break;
		}
		
		return new Promise(resolve => child_process.exec(command, (err, stdout, stderr) => {
			if(process.platform == 'win32')return resolve(!stdout.includes('No tasks are running which match the specified criteria'));
			else resolve(stdout.toLowerCase().includes(name))
		}));
	}
	static stop_process(name){
		var command = process.platform == 'win32'
			? 'taskkill /F /IM ' + JSON.stringify(name) : 'killall ' + JSON.stringify(name);
		
		// console.log(stdout, stderr, err);
		
		return new Promise(resolve => child_process.exec(command, (err, stdout, stderr) => resolve()));
	}
	static node_tree(nodes, parent = document){
		var output = {
				parent: parent,
			},
			match_container = /^\$\s+>?/g,
			match_parent = /^\^\s+>?/g;
		
		for(var label in nodes){
			var value = nodes[label];
			
			if(value instanceof Node)output[label] = value;
			else if(typeof value == 'object')output[label] = this.node_tree(value, output.container);
			else if(match_container.test(nodes[label])){
				if(!output.container){
					console.warn('No container is available, could not access', value);
					continue;
				}
				
				output[label] = output.container.querySelector(nodes[label].replace(match_container, ''));
			}else if(match_parent.test(nodes[label])){
				if(!output.parent){
					console.warn('No parent is available, could not access', value);
					continue;
				}
				
				output[label] = output.parent.querySelector(nodes[label].replace(match_parent, ''));
			}else{
				output[label] = document.querySelector(nodes[label]);
			}
			
			if(!output[label])console.warn('No node found, could not access', value);
		}
		
		return output;
	}
};

module.exports = Utils;