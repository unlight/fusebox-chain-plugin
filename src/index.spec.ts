/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/node/index.d.ts" />
import { ChainPlugin as Plugin } from './index';
import { FuseBox as FuseBoxClass, RawPlugin, JSONPlugin, WorkFlowContext } from 'fuse-box';
import { File } from 'fuse-box/dist/typings/File';
import { createEnv } from './create-env';
import assert = require('power-assert');

it('smoke', () => {
    assert(Plugin);
});

// it('fusebox bundle', async () => {
//     const [bundler, FuseBox] = await fuseBoxBundle({}, []);
//     assert(bundler);
//     assert(FuseBox);
// });

// it.only('should work without errors', async () => {
//     const plugins = [
//         // {
//         //     init: (context: WorkFlowContext) => {
//         //         context.allowExtension('.txt');
//         //     }
//         // }
//         Plugin({ extension: '.txt' }, [
//             RawPlugin({})
//         ]),
//     ];
//     const [bundler, FuseBox] = await fuseBoxBundle({
//         './app.js': `exports.doc = require('./doc.js')`,
//         './doc.js': `module.exports = 1`,
//     }, plugins, { cache: false });
//     const app = FuseBox.import('./app.js');
//     console.log('app', app);
// });

// // it('cache should be disabled', (done) => {
// //     const plugins = [
// //         [
// //             /\.txt$/,
// //             Plugin(),
// //             RawPlugin({ extensions: ['.txt'] }),
// //             {
// //                 transform: (file: File) => {
// //                     done();
// //                 }
// //             }
// //         ]
// //     ];
// //     fuseBoxBundle({
// //         './app.js': `exports.doc = require('./doc.txt')`,
// //         './doc.txt': `lorem`,
// //     }, plugins, { cache: false });
// // });

// // it.only('cache should be enabled', async () => {
// //     const plugins = [
// //         [
// //             /\.txt$/,
// //             Plugin(),
// //             RawPlugin({ extensions: ['.txt'] }),
// //             {
// //                 transform: (file: File) => {
// //                     throw new Error(`Shouldn't happen`);
// //                 }
// //             }
// //         ]
// //     ];
// //     const [bundler, FuseBox] = await fuseBoxBundle({
// //         './app.js': `exports.doc = require('./doc.txt')`,
// //         './doc.txt': `lorem`,
// //     }, plugins, { cache: true });
// //     const app = FuseBox.import('./app.js');
// //     console.log('app', app);
// //     // assert(app.doc === 'lorem');
// // });