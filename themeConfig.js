import { defineThemeConfig } from '@core'
import { Skins } from '@core/enums'
import { breakpointsVuetifyV3 } from '@vueuse/core'
import { VIcon } from 'vuetify/components/VIcon'

import { AppContentLayoutNav, ContentWidth, FooterType, NavbarType } from '@layouts/enums'
import craftNestLogo from '@images/logo.svg'

/*
 * Reconstructed for craftnest-client — this file never made it into the
 * repo's history (see vite.config.js's header note). `themeConfig.app.logo`
 * is rendered directly on the login page (VNodeRenderer in src/pages/login.vue),
 * so this is load-bearing, not cosmetic-only.
 *
 * i18n is off: nothing in this admin panel (nav, pages) references a locale
 * switcher, and the storefront/API are English-only per the scope doc.
 */
export const { themeConfig, layoutConfig } = defineThemeConfig({
  app: {
    title: 'CraftNest',
    logo: h('img', { src: craftNestLogo, alt: 'CraftNest', style: 'height:32px;width:auto;object-fit:contain;' }),
    contentWidth: ContentWidth.Boxed,
    contentLayoutNav: AppContentLayoutNav.Vertical,
    overlayNavFromBreakpoint: breakpointsVuetifyV3.lg - 1,
    i18n: {
      enable: false,
      defaultLocale: 'en',
      langConfig: [
        { label: 'English', i18nLang: 'en', isRTL: false },
      ],
    },
    theme: 'light',
    skin: Skins.Default,
    iconRenderer: VIcon,
  },
  navbar: {
    type: NavbarType.Sticky,
    navbarBlur: true,
  },
  footer: { type: FooterType.Static },
  verticalNav: {
    isVerticalNavCollapsed: false,
    defaultNavItemIconProps: { icon: 'tabler-circle' },
    isVerticalNavSemiDark: false,
  },
  horizontalNav: {
    type: 'sticky',
    transition: 'slide-y-reverse-transition',
    popoverOffset: 6,
  },
  icons: {
    chevronDown: { icon: 'tabler-chevron-down' },
    chevronRight: { icon: 'tabler-chevron-right', size: 20 },
    close: { icon: 'tabler-x', size: 20 },
    verticalNavPinned: { icon: 'tabler-circle-dot', size: 20 },
    verticalNavUnPinned: { icon: 'tabler-circle', size: 20 },
    sectionTitlePlaceholder: { icon: 'tabler-minus' },
  },
})
