import { imagetools } from './astro-imagetools/index.js'

export default {
	renderers: [],
	vite: {
		plugins: [
			imagetools(),
		]
	},
};
