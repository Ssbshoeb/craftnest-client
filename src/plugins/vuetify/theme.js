// CraftNest brand. The template ships a purple (#7367F0) that has nothing to
// do with a furniture workshop; these match the storefront palette so the
// client sees one brand across both.
export const staticPrimaryColor = '#3E5541' // deep olive — same as storefront primary
export const staticPrimaryDarkenColor = '#2D3F30'

/*
  Dark mode needs its own step, not the same one flipped: the deep olive above
  sits at 1.92:1 against the dark card, so charts drawn in it would be
  invisible. This lighter step clears the 3:1 mark floor, and takes dark text
  on top because white would only reach 3.59:1 on it.
*/
export const staticPrimaryDarkModeColor = '#6E8F76'
export const staticPrimaryDarkModeDarkenColor = '#5C7A63'
export const themes = {
  light: {
    dark: false,
    colors: {
      'primary': staticPrimaryColor,
      'on-primary': '#fff',
      'primary-darken-1': staticPrimaryDarkenColor,
      'secondary': '#808390',
      'on-secondary': '#fff',
      'secondary-darken-1': '#737682',
      'success': '#28C76F',
      'on-success': '#fff',
      'success-darken-1': '#24B364',
      'info': '#00BAD1',
      'on-info': '#fff',
      'info-darken-1': '#00A7BC',
      'warning': '#FF9F43',
      'on-warning': '#fff',
      'warning-darken-1': '#E68F3C',
      'error': '#FF4C51',
      'on-error': '#fff',
      'error-darken-1': '#E64449',
      /*
        Surfaces stay neutral on purpose.

        An earlier pass tinted them warm to match the storefront. That works on
        a marketing page, but this is a data tool: behind dense tables, status
        chips and charts a saturated warm ground looks dingy and pulls the
        semantic colours (pending / shipped / delivered / cancelled) towards
        each other. The brand lives in the accent instead.
      */
      'background': '#F7F7F6',
      'on-background': '#23272B',
      'surface': '#FFFFFF',
      'on-surface': '#23272B',
      'grey-50': '#FAFAFA',
      'grey-100': '#F5F5F5',
      'grey-200': '#EEEEEE',
      'grey-300': '#E0E0E0',
      'grey-400': '#BDBDBD',
      'grey-500': '#9E9E9E',
      'grey-600': '#757575',
      'grey-700': '#616161',
      'grey-800': '#424242',
      'grey-900': '#212121',
      'grey-light': '#FAFAFA',
      'perfect-scrollbar-thumb': '#DBDADE',
      'skin-bordered-background': '#fff',
      'skin-bordered-surface': '#fff',
      'expansion-panel-text-custom-bg': '#fafafa',
    },
    variables: {
      'code-color': '#d400ff',
      'overlay-scrim-background': '#2F2B3D',
      'tooltip-background': '#2F2B3D',
      'overlay-scrim-opacity': 0.5,
      'hover-opacity': 0.06,
      'focus-opacity': 0.1,
      'selected-opacity': 0.08,
      'activated-opacity': 0.16,
      'pressed-opacity': 0.14,
      'dragged-opacity': 0.1,
      'disabled-opacity': 0.4,
      'border-color': '#2F2B3D',
      'border-opacity': 0.12,
      'table-header-color': '#EAEAEC',
      'high-emphasis-opacity': 0.9,
      'medium-emphasis-opacity': 0.7,
      'switch-opacity': 0.2,
      'switch-disabled-track-opacity': 0.3,
      'switch-disabled-thumb-opacity': 0.4,
      'switch-checked-disabled-opacity': 0.3,
      'track-bg': '#F1F0F2',

      // Shadows
      'shadow-key-umbra-color': '#2F2B3D',
      'shadow-xs-opacity': 0.10,
      'shadow-sm-opacity': 0.12,
      'shadow-md-opacity': 0.14,
      'shadow-lg-opacity': 0.16,
      'shadow-xl-opacity': 0.18,
    },
  },
  dark: {
    dark: true,
    colors: {
      'primary': staticPrimaryDarkModeColor,
      'on-primary': '#14180F',
      'primary-darken-1': staticPrimaryDarkModeDarkenColor,
      'secondary': '#808390',
      'on-secondary': '#fff',
      'secondary-darken-1': '#737682',
      'success': '#28C76F',
      'on-success': '#fff',
      'success-darken-1': '#24B364',
      'info': '#00BAD1',
      'on-info': '#fff',
      'info-darken-1': '#00A7BC',
      'warning': '#FF9F43',
      'on-warning': '#fff',
      'warning-darken-1': '#E68F3C',
      'error': '#FF4C51',
      'on-error': '#fff',
      'error-darken-1': '#E64449',
      // Neutral dark, for the same reason as the light theme above.
      'background': '#17191A',
      'on-background': '#E7E9E8',
      'surface': '#212426',
      'on-surface': '#E7E9E8',
      'grey-50': '#26293A',
      'grey-100': '#2F3349',
      'grey-200': '#26293A',
      'grey-300': '#4A5072',
      'grey-400': '#5E6692',
      'grey-500': '#7983BB',
      'grey-600': '#AAB3DE',
      'grey-700': '#B6BEE3',
      'grey-800': '#CFD3EC',
      'grey-900': '#E7E9F6',
      'grey-light': '#353A52',
      'perfect-scrollbar-thumb': '#4A5072',
      'skin-bordered-background': '#2F3349',
      'skin-bordered-surface': '#2F3349',
    },
    variables: {
      'code-color': '#d400ff',
      'overlay-scrim-background': '#171925',
      'tooltip-background': '#F7F4FF',
      'overlay-scrim-opacity': 0.6,
      'hover-opacity': 0.06,
      'focus-opacity': 0.1,
      'selected-opacity': 0.08,
      'activated-opacity': 0.16,
      'pressed-opacity': 0.14,
      'dragged-opacity': 0.1,
      'disabled-opacity': 0.4,
      'border-color': '#E1DEF5',
      'border-opacity': 0.12,
      'table-header-color': '#535876',
      'high-emphasis-opacity': 0.9,
      'medium-emphasis-opacity': 0.7,
      'switch-opacity': 0.4,
      'switch-disabled-track-opacity': 0.4,
      'switch-disabled-thumb-opacity': 0.8,
      'switch-checked-disabled-opacity': 0.3,
      'track-bg': '#3A3F57',

      // Shadows
      'shadow-key-umbra-color': '#131120',
      'shadow-xs-opacity': 0.16,
      'shadow-sm-opacity': 0.18,
      'shadow-md-opacity': 0.2,
      'shadow-lg-opacity': 0.22,
      'shadow-xl-opacity': 0.24,
    },
  },
}
export default themes
