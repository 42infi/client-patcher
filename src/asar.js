'use strict';

var fs = require(typeof window == 'object' ? 'original-fs' : 'fs'),
	asar_fs = require('fs'),
	path = require('path');

class Asar {
	constructor(){
		this.header = { files: {} };
	}
	resolve(input, keep_slash = false){
		return path.posix.resolve('/', input).replace(/\\/g, '/').slice(keep_slash ? 0 : 1);
	}
	async insert_folder(folder, alias){
		var iterate = async (folder, parent) => {
			for(let file of await asar_fs.promises.readdir(folder)){
				let location = path.join(folder, file),
					stat = await asar_fs.promises.stat(location);
				
				parent[file] = {};
				
				if(stat.isDirectory()){
					parent[file].files = {};
					await iterate(location, parent[file].files);
				}else parent[file].data = await asar_fs.promises.readFile(location);
			}
		};
		
		await iterate(folder, (this.header.files[alias] = { files: {} }).files);
	}
	async delete(path){
		path = this.resolve(path);
		
		var last_depth,
			last_file,
			depth = this.header;
		
		for(let file of path.split('/'))if(!(depth = (last_depth = depth.files)[last_file = file]))throw new Error('File ' + file + ' not found');
		
		return delete last_depth[last_file];
	}
	async exists(path){
		path = this.resolve(path);
		
		var depth = this.header;
		
		for(let file of path.split('/'))if(!(depth = depth.files[file]))return false;
		
		return true;
	}
	async create_folder(path){
		var depth = this.header;
		
		for(let file of this.resolve(path).split('/'))depth = depth.files[file] || (depth.files[file] = { files: {} });
	}
	async write_file(path, data){
		var depth = this.header;
		
		for(let file of this.resolve(path).split('/'))depth = depth.files[file] || (depth.files[file] = {});
		
		depth.data = Buffer.from(data);
	}
	async read_folder(path){
		var depth = this.header;
		
		for(let file of this.resolve(path).split('/'))if(!file)continue;
		else if(!(depth = depth.files[file]))throw new Error(`File ${path} not found`);
		
		if(!depth.files)throw new TypeError('Attempting to read a file as a folder');
		
		return Object.keys(depth.files);
	}
	async read_file(path){
		path = this.resolve(path);
		
		var depth = this.header;
		
		for(let file of path.split('/'))if(!(depth = depth.files[file]))throw new Error(`File ${path} not found;`);
		
		if(depth.files)throw new TypeError('Attempting to read a folder as a file');
		
		var output = Buffer.alloc(depth.size);
		
		var handle = await fs.promises.open(this.file, 'r');
		
		await handle.read(output, 0, output.byteLength, +depth.offset + this.header.size + 8);
		
		await handle.close();
		
		return output;
	}
	async open(path){
		this.file = path;
		
		var handle = await fs.promises.open(this.file, 'r'),
			size_buf = Buffer.alloc(8);
		
		if((await handle.read(size_buf, 0, size_buf.byteLength, 0)).bytesRead != size_buf.byteLength){
			await handle.close();
			throw new Error('Unable to read header size (V0 format)');
		}
		
		var size = size_buf.readUInt32LE(4),
			header_buf = Buffer.alloc(size - 8);
		
		if((await handle.read(header_buf, 0, header_buf.byteLength, 16)).bytesRead != header_buf.byteLength){
			await handle.close();
			throw new Error('Unable to read header (V0 format)');
		}
		
		await handle.close();
		
		try{
			// remove padding
			this.header = JSON.parse(header_buf.toString().replace(/\0+$/g, '')); 
			this.header.size = size;
		}catch(err){
			throw new Error('Unable to parse header (assumed old format)');
		}
	}
	async save(save){
		var write = [],
			write_bl = 0, // bytelength
			iterate = async (folder, tree) => {
				var files = {};
				
				for(let name in folder.files){
					let file = folder.files[name],
						location = path.posix.join(...tree, name);
					
					if(file.files){ // folder
						files[name] = await iterate(file, [ ...tree, name ]);
					}else{
						files[name] = {
							size: file.size,
							offset: write_bl + '',
						};
						
						if(file.data){
							files[name].size = file.data.byteLength;
							write_bl += file.data.byteLength;
							write.push(file.data);
							delete file.data;
						}else{
							let data = await this.read_file(location);
							write_bl += data.byteLength;
							write.push(data);
						}
					}
				}
				
				return { files: files };
			},
			iterated = await iterate(this.header, []),
			header = Buffer.from(JSON.stringify(iterated)),
			header_size_buf = Buffer.alloc(16);
		
		header_size_buf.writeUInt32LE(0x4, 0)
		header_size_buf.writeUInt32LE(header.byteLength + 8, 4)
		header_size_buf.writeUInt32LE(header.byteLength + 4, 8)
		header_size_buf.writeUInt32LE(header.byteLength, 12)
		
		await fs.promises.writeFile(save || this.file, Buffer.concat([ header_size_buf, header, ...write ]));
		
		this.header.size = header.byteLength;
		this.header = iterated;
	}
};

module.exports = Asar;