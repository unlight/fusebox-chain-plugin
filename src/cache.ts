import memoryFs = require('memory-fs');
import { statSync } from 'fs';
import * as Path from 'path';

export default function createCache(fs = new memoryFs()) {
	return {
		mtime(path: string) {
			return statSync(path).mtime.getTime();
		},
		put(path: string, content: Object) {
			content['mtime'] = this.mtime(path);
			fs.mkdirpSync(Path.dirname(path));
			return fs.writeFileSync(path, JSON.stringify(content));
		},
		get(path: string) {
			if (fs.existsSync(path)) {
				let result = JSON.parse(fs.readFileSync(path));
				if (result.mtime === this.mtime(path)) {
					return result;
				}
			}
		}
	};
}