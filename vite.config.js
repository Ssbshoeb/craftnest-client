import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports, getPascalCaseRouteName } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import MetaLayouts from 'vite-plugin-vue-meta-layouts'
import vuetify from 'vite-plugin-vuetify'
import svgLoader from 'vite-svg-loader'

/*
 * Reconstructed for craftnest-client — the copy of this file (and index.html,
 * themeConfig.js) never made it into this project's history (confirmed via
 * `git log`: neither has ever been committed here), so `npm run dev`/`build`
 * could not run at all. Rebuilt against the actual folder layout that ships
 * with this Vuexy 9.4 checkout (src/@core, src/@layouts, src/assets/styles),
 * not copied from another project's branding.
 *
 * No `@db` / `@api-utils` aliases: this project has no `plugins/fake-api`
 * folder (CraftNest talks to the real Laravel API), so those would point at
 * nothing.
 */
export default defineConfig({
  plugins: [
    // Docs: https://github.com/posva/unplugin-vue-router
    // ℹ️ This plugin should be placed before the vue plugin
    VueRouter({
      getRouteName: routeNode => {
        // Convert pascal case to kebab case
        return getPascalCaseRouteName(routeNode)
          .replace(/([a-z\d])([A-Z])/g, '$1-$2')
          .toLowerCase()
      },
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag === 'swiper-container' || tag === 'swiper-slide',
        },
      },
    }),
    VueDevTools(),
    vueJsx(),

    // Docs: https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin
    vuetify({
      styles: {
        configFile: 'src/assets/styles/variables/_vuetify.scss',
      },
    }),

    // Docs: https://github.com/dishait/vite-plugin-vue-meta-layouts
    MetaLayouts({
      target: './src/layouts',
      defaultLayout: 'default',
    }),

    // Docs: https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: ['src/@core/components', 'src/components'],
      dts: true,
      resolvers: [
        componentName => {
          // Auto-import `VueApexCharts` (used by Dashboard / Reports charts)
          if (componentName === 'VueApexCharts')
            return { name: 'default', from: 'vue3-apexcharts', as: 'VueApexCharts' }
        },
      ],
    }),

    // Docs: https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ['vue', VueRouterAutoImports, '@vueuse/core', '@vueuse/math', 'pinia'],
      dirs: [
        './src/@core/utils',
        './src/@core/composable/',
        './src/composables/',
        './src/utils/',
        './src/plugins/*/composables/*',
      ],
      vueTemplate: true,

      // ℹ️ Disabled to avoid confusion & accidental usage
      ignore: ['useCookies', 'useStorage'],
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
      },
    }),
    svgLoader(),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@themeConfig': fileURLToPath(new URL('./themeConfig.js', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
      '@images': fileURLToPath(new URL('./src/assets/images/', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/assets/styles/', import.meta.url)),
      '@configured-variables': fileURLToPath(new URL('./src/assets/styles/variables/_template.scss', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // No proxy: useApi.js / api.service.js call VITE_API_BASE_URL directly
    // (an absolute URL, e.g. http://127.0.0.1:8000/api), so requests never go
    // through Vite's dev server. CORS on craftnest-api must allow this origin
    // (FRONTEND_ADMIN_URL in the API's .env).
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    exclude: ['vuetify'],
    entries: [
      './src/**/*.vue',
    ],
  },
})
