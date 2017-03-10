import memoryFs = require('memory-fs');
import * as fs from 'fs';
import * as Path from 'path';

export default function createCache(mfs = new memoryFs(), statSync = fs.statSync) {
	return {
		mtime(path: string) {
			return statSync(path).mtime.getTime();
		},
		put(path: string, content: Object) {
			content['mtime'] = this.mtime(path);
			mfs.mkdirpSync(Path.dirname(path));
			return mfs.writeFileSync(path, JSON.stringify(content));
		},
		get(path: string) {
			if (mfs.existsSync(path)) {
				let result = JSON.parse(mfs.readFileSync(path));
				if (result.mtime === this.mtime(path)) {
					return result;
				}
			}
		}
	};
}