import { applyTransforms as coreApplyTransforms, loadImage as coreLoadImage } from 'imagetools-core'
import fs from 'fs'
import stream from 'stream'
export { builtins, generateTransforms } from 'imagetools-core'

const fauxLoadImage = (pathname) => {
	const readStream = fs.createReadStream(pathname)

	const patch = readStream => {
		const patched = {
			faux: true,
			format: 'svg',
			toBuffer() {
				return fs.readFileSync(pathname)
			},
			clone() {
				return patched
			},
		}

		return patched
	}

	return patch(readStream)
}

function stream2buffer(stream) {
	return new Promise((resolve, reject) => {
		const _buf = []

		stream.on('data', (chunk) => _buf.push(chunk))
		stream.on('end', () => resolve(Buffer.concat(_buf)))
		stream.on('error', (err) => reject(err))
	});
} 

/** @type {import('imagetools-core').loadImage} */
export const loadImage = (pathname) => {
	return /\.svg$/.test(pathname) ? fauxLoadImage(pathname) : coreLoadImage(pathname)
}

const fauxApplyTransforms = (_transforms, image, _minify) => Promise.resolve({ image, metadata: { format: image.format } })

/** @type {import('imagetools-core').applyTransforms} */
export const applyTransforms = (transforms, image, minify) => {
	return image.faux ? fauxApplyTransforms(transforms, image, minify) : coreApplyTransforms(transforms, image, minify)
}
