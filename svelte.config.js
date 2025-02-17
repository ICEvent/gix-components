import adapter from "@sveltejs/adapter-static";
import autoprefixer from "autoprefixer";
import { mdsvex } from "mdsvex";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessor
  preprocess: [
    preprocess({
      postcss: {
        plugins: [autoprefixer],
      },
    }),
    mdsvex({
      extensions: [".md"],
    }),
  ],

  extensions: [".svelte", ".md"],

  kit: {
    adapter: adapter(),
    serviceWorker: {
      register: false,
    },
  },
};

export default config;
