/// <reference path='../node_modules/@types/node/index.d.ts' />
import memoryFs = require('memory-fs');
import * as Path from 'path';

const mfs = new memoryFs();
const testPath = `/component/main.scss`;
const encodedTestPath = '/' + encodeURIComponent(testPath);

mfs.mkdirpSync(Path.dirname(testPath));
mfs.mkdirpSync(Path.dirname(encodedTestPath));
mfs.writeFileSync(testPath, 'thigmotropism');
mfs.writeFileSync(encodedTestPath, 'thigmotropism');

const nperf = require('nperf');

nperf(1000)
	.test('full path', () => {
		mfs.existsSync(testPath);
		mfs.readFileSync(testPath);
	})
	.test('encoded path', () => {
		mfs.existsSync(encodedTestPath);
		mfs.readFileSync(encodedTestPath);
	})
	.test('trycatch full', () => {
		try {
			mfs.readFileSync(testPath);
		} catch (e) {
		}
	})
	.test('trycatch encoded', () => {
		encodeURIComponent(encodedTestPath);
		try {
			mfs.readFileSync(encodedTestPath);
		} catch (e) {
		}
	})
	.run();
