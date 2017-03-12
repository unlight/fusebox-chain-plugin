# fusebox-chain-plugin
Custom chain plugin for FuseBox

INSTALL
---
```
npm i -D fusebox-chain-plugin
```

USAGE
---
```ts
import { ChainPlugin } from 'fusebox-chain-plugin';
```
```ts
// part of fusebox config
plugins: [
	ChainPlugin(options, [
		SassPlugin(),
		CSSPlugin()
	])
]
```
```ts
ChainPlugin({ extension: '.scss', test: /\.scss$/ }, {
    '.component.scss': [
        SassPlugin({ sourceMap: false }),
        RawPlugin({}),
    ],
    '.scss': [
        SassPlugin({}),
        CSSPlugin(),
    ]
}),
```

API
---
```
ChainPlugin(plugins: Plugin[] | { [k: string]: Plugin[] });
ChainPlugin(options: Options, plugins: Plugin[] | { [k: string]: Plugin[] });
```
#### Options
* `extension?: string`
	Will be passed to `context.allowExtension(ext)` on init.
* `extensions?: string[]`
	Same as `extension`
* `test?: RegExp`
	Filter files by this regexp, if not set, first in plugins array will be used.
* `hmr?: boolean`
	Enable HMR.
	Default: `true`
* `hmrType?: string`
	Since plugin can be applied to any type of file, you muse explicitly set type of HMR file
	which will be emitted (this is non-usual case and you need custom *frontend* fusebox plugin
	to handle HMR properly).

DEBUG
---
* Debug benchmark `inspect node_modules\ts-node\dist\_bin.js benchmarks\benchmark.ts`
