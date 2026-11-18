import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import ConverterView from '@/features/converter/ConverterView.vue'
import { DEFAULT_MODE_ID, MODES } from '@/features/converter/modes'

const modeRoutes: RouteRecordRaw[] = MODES.map((mode) => ({
  path: `/${mode.id}`,
  name: mode.id,
  component: ConverterView,
  props: { mode },
  meta: { title: mode.label },
}))

const router = createRouter({
  // Hash history keeps deep links working on GitHub Pages, which has no SPA fallback.
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: DEFAULT_MODE_ID } },
    ...modeRoutes,
    { path: '/:pathMatch(.*)*', redirect: { name: DEFAULT_MODE_ID } },
  ],
})

const APP_TITLE = 'CIDR Readable'
router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : undefined
  document.title = title === undefined ? APP_TITLE : `${title} · ${APP_TITLE}`
})

export default router
