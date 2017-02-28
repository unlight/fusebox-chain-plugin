/// <reference path='../node_modules/@types/mocha/index.d.ts' />
/// <reference path='../node_modules/@types/node/index.d.ts' />
import { ChainPlugin as Plugin } from './index';
import { FuseBox as FuseBoxClass, RawPlugin, JSONPlugin, WorkFlowContext, SassPlugin, CSSPlugin } from 'fuse-box';
import { File } from 'fuse-box/dist/typings/File';
import { createEnv } from './create-env';
import assert = require('assert');

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

it('sass and css plugin', async () => {
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
                Plugin({extensions: ['.scss']}, [
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


it.skip('should cache', async () => {
    let fileMap = new Map();
    const output = await createEnv({
        project: {
            cache: true,
            files: {
                'index.ts': `
                    global.__fsbx_css = function() {}
                    require('./a.scss');`,
                'a.scss': 'body {color:red};',
            },
            plugins: [
                Plugin({ extensions: ['.scss'] }, [
                    SassPlugin({ sourceMap: false, outputStyle: 'compressed' }),
                    CSSPlugin(),
                    {
                        transform: (file: File) => fileMap.set(file.info.fuseBoxPath, file)
                    },
                ])
            ],
            instructions: '>index.ts'
        }
    });
    const FuseBox = output.project.FuseBox;
    const fusebox = output.fusebox;
    let [[path, file]] = Array.from(fileMap.entries());
    let cached = fusebox.context.cache.getStaticCache(file);
    assert(cached);
});