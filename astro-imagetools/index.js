// @ts-check

import { createContext } from './context.js'
import { createImageTools } from './imagetools.js'
import { posix as ps } from 'path'

/** @type {PluginCreator} */
export const imagetools = () => {
	const context = createContext()
	const images = createImageTools()

	return {
		name: 'astro-imagetools',
		enforce: 'pre',
		configResolved(config) {
			context.configResolved(config)
		},
		load(id) {
			const info = context.getInfo(id)

			if (images.isImageExtension(info.extension)) {
				return context.defineAsset(info.pathname, info.params).toExportString()
			}
		},
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const asset = context.getAssetByURL(req.url)

				if (asset) {
					return images.pipeAssetToResponse(asset, res)
				}

				next()
			})
		},
		generateBundle(_options, bundle) {
			for (const [pathname, asset] of context.assets) {
				for (const [_chunkId, output] of Object.entries(bundle)) {
					if (typeof output.source === 'string') {
						return images.getTransformedImageByAsset(asset).then(
							async ({ image, metadata }) => this.getFileName(
								this.emitFile({
									name: ps.basename(asset.pathname, asset.extension) + `.${metadata.format}`,
									type: 'asset',
									source: await image.toBuffer(),
								})
							)
						).then(
							referenceId => {
								if (typeof output.source === 'string') {
									output.source = output.source.replace(pathname, referenceId)
								}
							}
						)
					}
				}
			}
		},
	}
}

// Exports

/** @typedef {{ (): Plugin }} PluginCreator */
/** @typedef {Omit<import('vite').Plugin, 'generateBundle'> & { generateBundle: GenerateBundle }} Plugin */
/** @typedef {{ (this: import('rollup').PluginContext, options: import('rollup').NormalizedOutputOptions, bundle: OutputBundle, isWrite: boolean): void }} GenerateBundle */

// Interfaces

/** @typedef {{ [fileName: string]: import('rollup').EmittedAsset }} OutputBundle */
