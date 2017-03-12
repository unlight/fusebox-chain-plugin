import { Plugin, WorkFlowContext } from 'fuse-box/dist/typings/core/WorkflowContext';
import { File } from 'fuse-box/dist/typings/core/File';
import * as assert from 'assert';
import createCache from './cache';
import endsWith = require('lodash/endsWith');
import find = require('lodash/find');
import values = require('lodash/values');
import flatten = require('lodash/flatten');

export interface Options {
	extension?: string;
	extensions?: string[];
	test?: RegExp;
	hmr?: boolean;
	hmrType?: string;
}

export type Plugins = Plugin[] | { [k: string]: Plugin[] };

export function ChainPlugin(plugins: Plugins);
export function ChainPlugin(options: Options, plugins: Plugins);
export function ChainPlugin(options: Options, plugins?: any) {
	return new FuseboxChainPlugin(options, plugins);
}

export class FuseboxChainPlugin implements Plugin {

	public test;
	public hmrType = null;
	private options: Options;
	private plugins: Plugin[] = [];
	private context: WorkFlowContext;
	private cache = createCache();
	private conditions: any;
	private hmr: boolean = true;
	private hmrPlugins: string[] = [
		'CSSPluginClass',
		'RawPluginClass',
		'BabelPluginClass',
		'VuePluginClass',
		'FuseBoxHTMLPlugin',
	];

	constructor(items: any[]);
	constructor(options: any, items: any[]);

	constructor(options, items?) {
		if (items === undefined) {
			items = options;
			options = {};
		}
		if (Array.isArray(items)) {
			this.plugins = items;
		} else if (items && typeof items === 'object') {
			this.conditions = items;
		}
		this.options = options;
		if (this.options.hmr !== undefined) {
			this.hmr = Boolean(this.options.hmr);
		}
		if (this.options.hmrType) {
			this.hmrType = this.options.hmrType;
		}
		if (this.options.test) {
			this.test = this.options.test;
		} else if (this.plugins.length > 0) {
			this.test = this.plugins[0].test;
		}
	}

	private _triggerPlugins;

	private get triggerPlugins() {
		if (this._triggerPlugins === undefined) {
			this._triggerPlugins = this.plugins;
			if (this.conditions) {
				let pluginClassList = [];
				this._triggerPlugins = flatten<Plugin>(values(this.conditions))
					.filter(p => {
						if (pluginClassList.indexOf(p.constructor) !== -1) {
							return false;
						}
						pluginClassList.push(p.constructor);
						return true;
					});
			}
		}
		return this._triggerPlugins;
	}

	public init(context: WorkFlowContext) {
		this.context = context;
		if (this.options.extension) {
			context.allowExtension(this.options.extension);
		} else if (this.options.extensions && this.options.extensions.length > 0) {
			this.options.extensions.forEach(ext => context.allowExtension(ext));
		}
		this.triggerPlugins
			.filter(p => p.init)
			.forEach(p => p.init(context));
	}

	public bundleStart(context: WorkFlowContext) {
		this.triggerPlugins
			.filter(p => p.bundleStart)
			.forEach(p => p.bundleStart(context));
	}

	public bundleEnd(context: WorkFlowContext) {
		this.triggerPlugins
			.filter(p => p.bundleEnd)
			.forEach(p => p.bundleEnd(context));
	}

	public transform(file: File) {
		let useCache = this.context.useCache;
		if (useCache) {
			let cached = this.cache.get(file.absPath);
			if (cached) {
				file.isLoaded = true;
				file.contents = cached.contents;
				file.sourceMap = cached.sourceMap;
				file.alternativeContent = cached.alternativeContent;
				file.headerContent = cached.headerContent;
				file.analysis.dependencies = cached.dependencies;
				file.analysis.skip();
				return;
			}
		}
		file.loadContents();
		let plugins: Plugin[];
		if (this.conditions) {
			plugins = find<Plugin[]>(this.conditions, (value, key: string) => endsWith(file.info.fuseBoxPath, key));
		} else {
			plugins = this.plugins;
		}
		return plugins.reduce((p, plugin) => p.then(() => plugin.transform(file)), Promise.resolve())
			.then(() => {
				if (useCache) {
					this.cache.put(file.absPath, {
						contents: file.contents,
						sourceMap: file.sourceMap,
						alternativeContent: file.alternativeContent,
						headerContent: file.headerContent,
						dependencies: file.analysis.dependencies,
					});
					if (!this.hmr) {
						return;
					}
					let [lastPlugin] = plugins.slice(-1);
					let isLastPluginHmr = find(this.hmrPlugins, name => name === (lastPlugin.constructor && lastPlugin.constructor.name));
					if (isLastPluginHmr) {
						return;
					}
					this.context.sourceChangedEmitter.emit({
						type: this.hmrType,
						content: file.contents,
						path: file.info.fuseBoxPath,
					});
				}
			});
	}
}
