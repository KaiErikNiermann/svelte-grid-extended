/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	daisyui: {
		themes: ['emerald', 'forest']
	},
	plugins: [daisyui]
};

export default config;
