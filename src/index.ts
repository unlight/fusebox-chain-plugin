import { Plugin, WorkFlowContext } from 'fuse-box/dist/typings/core/WorkflowContext';
import { File } from 'fuse-box/dist/typings/core/File';
import * as assert from 'assert';
import createCache from './cache';

export interface ChainOptions {
	extension?: string;
	extensions?: string[];
	test?: RegExp;
}

export class FuseboxChainPlugin implements Plugin {

	public test;
	private static defaultOptions = {};
	private options: ChainOptions;
	private plugins: Plugin[] = [];
	private context: WorkFlowContext;
	private cache = createCache();

	constructor(options, items) {
		if (items === undefined) {
			items = options;
			options = FuseboxChainPlugin.defaultOptions;
		}
		assert(Array.isArray(items), 'Array is expected');
		this.plugins = items;
		this.options = options;
	}

	public init(context: WorkFlowContext) {
		this.context = context;
		if (this.options.extension) {
			context.allowExtension(this.options.extension);
		} else if (this.options.extensions && this.options.extensions.length > 0) {
			this.options.extensions.forEach(ext => context.allowExtension(ext));
		}
		if (this.options.test) {
			this.test = this.options.test;
		} else if (this.plugins.length > 0) {
			this.test = this.plugins[0].test;
		}
		this.plugins
			.filter(p => p.init)
			.forEach(p => p.init(context));
	}

	bundleStart(context: WorkFlowContext) {
		this.plugins
			.filter(p => p.bundleStart)
			.forEach(p => p.bundleStart(context));
	}

	bundleEnd(context: WorkFlowContext) {
		this.plugins
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
		let p = Promise.resolve();
		for (let i = 0; i < this.plugins.length; i++) {
			let plugin = this.plugins[i];
			p = p.then(() => plugin.transform(file));
		}
		p.then(() => {
			if (useCache) {
				this.cache.put(file.absPath, {
					contents: file.contents,
					sourceMap: file.sourceMap,
					alternativeContent: file.alternativeContent,
					headerContent: file.headerContent,
					dependencies: file.analysis.dependencies,
				});
				this.context.sourceChangedEmitter.emit({
					type: null,
					content: file.contents,
					path: file.info.fuseBoxPath,
				});
			}
		});
		return p;
	}
}

export function ChainPlugin(options, plugins?) {
	return new FuseboxChainPlugin(options, plugins);
}
