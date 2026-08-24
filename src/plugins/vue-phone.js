import 'flag-icons/css/flag-icons.min.css'
import { createVPhoneInput } from 'v-phone-input'
import 'v-phone-input/dist/v-phone-input.css'
import { VAutocomplete } from 'vuetify/lib/components/index.mjs'

const vPhoneInput = createVPhoneInput({
  countryIconMode: 'svg',
  enableSearchingCountry: true,
  defaultCountry: 'In',
  singleLine: true,
  countryLabel: '',
  allCountries: [
    {
      name: 'India',
      iso2: 'IN',
      dialCode: '91',
    },
    {
      name: 'UK',
      iso2: 'GB',
      dialCode: '44',
    },
    {
      name: 'US',
      iso2: 'US',
      dialCode: '1',
    },
    {
      name: 'UAE',
      iso2: 'AE',
      dialCode: '971',
    },
    {
      name: 'SA',
      iso2: 'SA',
      dialCode: '966',
    },
    {
      name: 'Bahrain',
      iso2: 'BH',
      dialCode: '973',
    },
    {
      name: 'Kuwait',
      iso2: 'KW',
      dialCode: '965',
    },
    {
      name: 'Oman',
      iso2: 'OM',
      dialCode: '968',
    },
    {
      name: 'Qatar',
      iso2: 'QA',
      dialCode: '974',
    },
   
  ],
})
  
export default function (app) {
  app.component('VAutocomplete', VAutocomplete)

  app.use(vPhoneInput)
}
    