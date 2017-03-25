/// <reference path='../node_modules/@types/mocha/index.d.ts' />
import { ChainPlugin as Plugin } from './index';
import { FuseBox, RawPlugin, JSONPlugin, SassPlugin, CSSPlugin } from 'fuse-box';
import { File } from 'fuse-box/dist/typings/core/File';
import { WorkFlowContext } from 'fuse-box/dist/typings/core/WorkflowContext';
import { createEnv } from './env.spec';
import assert = require('assert');
import pkgDir = require('pkg-dir');
import del = require('del');
import * as Path from 'path';
import createCache from './cache';

it('smoke', () => {
    assert(Plugin);
    assert(createEnv);
});

it('fusebox project', async () => {
    const output = await createEnv({
        project: {
            plugins: [
            ],
            files: {
                'index.ts': `exports.hello = require('./hello')`,
                'hello.ts': `module.exports = 'hi'`,
            },
            instructions: 'index.ts'
        }
    });
    assert(output);
    const FuseBox = output.project.FuseBox;
    let helloContent = FuseBox.import('./hello');
    assert.equal(helloContent, 'hi');
});

it('plugin simple test', async () => {
    const output = await createEnv({
        project: {
            plugins: [
                Plugin({ extensions: ['.text'] }, [
                    RawPlugin({}),
                ])
            ],
            files: {
                'index.ts': `exports.a = require('./lorem.text')`,
                'lorem.text': `lorem ipsum`,
            },
            instructions: 'index.ts'
        }
    });
    assert(output);
    const FuseBox = output.project.FuseBox;
    let lorem = FuseBox.import('./lorem.text');
    assert.equal(lorem, 'lorem ipsum');
});

it('sass and css plugin (no cache)', async () => {
    const output = await createEnv({
        project: {
            files: {
                'index.ts': `
                    global.__fsbx_css = function() {}
                    require('./a.scss'); 
                    require('./b.scss')`,
                'a.scss': 'body {color:red};',
                'b.scss': 'h1 {color:red};'
            },
            plugins: [
                // [SassPlugin({ sourceMap: false, outputStyle: 'compressed' }), CSSPlugin()]
                Plugin({ extensions: ['.scss'] }, [
                    SassPlugin({ sourceMap: false, outputStyle: 'compressed' }),
                    CSSPlugin(),
                ])
            ],
            instructions: '>index.ts'
        }
    });
    const FuseBox = output.project.FuseBox;
    const projectContents = output.projectContents.toString();
    assert(projectContents.includes('__fsbx_css("a.scss", "body{color:red}'));
    assert(projectContents.includes('__fsbx_css("b.scss", "h1{color:red}'));
});

it('should cache', (done) => {
    const outFile = Path.join(pkgDir.sync(), '.fusebox', 'cache1.js');
    del.sync(outFile);
    const fileMap = new Map();
    const plugin = Plugin([
        SassPlugin({ sourceMap: false, outputStyle: 'compressed' }),
        CSSPlugin(),
        {
            transform: (file: File) => {
                fileMap.set(file.info.fuseBoxPath, file.absPath);
            }
        }
    ]);
    const cache = (plugin as any).cache;
    const fusebox = FuseBox.init({
        cache: true,
        log: false,
        homeDir: Path.join(pkgDir.sync(), 'fixtures', 'cache1'),
        outFile: outFile,
        plugins: [plugin],
    });
    fusebox.bundle('>index.js')
        .then(d => {
            let content: string = d.content.toString();
            assert(content.includes('__fsbx_css("a.scss", "body{color:red}'));
            let filePath = fileMap.get('a.scss');
            let cached = cache.get(filePath);
            assert(cached);
            done();
        })
        .catch(done);
});

it('inline sass', (done) => {
    const outFile = Path.join(pkgDir.sync(), '.fusebox', 'inline-sass.js');
    del.sync(outFile);
    const plugin = Plugin([
        SassPlugin({ sourceMap: false, outputStyle: 'compressed' }),
        RawPlugin({}),
    ]);
    const fusebox = FuseBox.init({
        cache: false,
        log: false,
        homeDir: Path.join(pkgDir.sync(), 'fixtures', 'inline-sass'),
        outFile: outFile,
        plugins: [plugin],
    });
    fusebox.bundle('>index.js')
        .then(d => {
            let content: string = d.content.toString();
            assert(content.includes(`module.exports = "body{color:blue}`));
            done();
        })
        .catch(done);
});

it('conditionally', async () => {
    const output = await createEnv({
        project: {
            files: {
                'index.js': `
                    global.__fsbx_css = () => {};
                    require('./global.scss'); 
                    require('./a.component.scss')`,
                'a.component.scss': '* {color:blue}',
                'global.scss': 'h1 {color:red}'
            },
            plugins: [
                Plugin({ extensions: ['.scss'], test: /\.scss$/ }, {
                    '.component.scss': [
                        SassPlugin({ sourceMap: false, outputStyle: 'compressed' }),
                        RawPlugin({}),
                    ],
                    '.scss': [
                        SassPlugin({ sourceMap: false, outputStyle: 'compressed' }),
                        CSSPlugin(),
                    ]
                })
            ],
            instructions: '>index.js'
        }
    });
    const FuseBox = output.project.FuseBox;
    const projectContents = output.projectContents.toString();
    assert(projectContents.includes(`__fsbx_css("global.scss", "h1{color:red}`));
    assert(projectContents.includes(`module.exports = "*{color:blue}`));
});