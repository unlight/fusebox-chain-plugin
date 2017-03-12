import memoryFs = require('memory-fs');
import * as fs from 'fs';
import * as Path from 'path';

function createMtime() {
	return function mtime(path: string) {
		return fs.statSync(path).mtime.getTime();
	};
}

export default function createCache(mfs = new memoryFs(), mtime = createMtime()) {
	return {
		put(path: string, content: Object) {
			content['mtime'] = mtime(path);
			mfs.mkdirpSync(Path.dirname(path));
			return mfs.writeFileSync(path, JSON.stringify(content));
		},
		get(path: string) {
			if (mfs.existsSync(path)) {
				let result = JSON.parse(mfs.readFileSync(path));
				if (result.mtime === mtime(path)) {
					return result;
				}
			}
		}
	};
}