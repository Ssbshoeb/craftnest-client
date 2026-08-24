import { stringifyQuery } from 'ufo'
import { toValue } from 'vue'

export const createUrl = (url, options) => computed(() => {
  if (!options?.query)
    return toValue(url)
  const _url = toValue(url)
  const _query = toValue(options?.query)
  let queryStringParts = []
  
  const queryObj = Object.fromEntries(Object.entries(_query).map(([key, val]) => [key, toValue(val)]))
  const search = queryObj.search

  // Manually handle the search parameters if 'search' is an object
  if (search && typeof search === 'object' && !Array.isArray(search)) {
    Object.entries(search).forEach(([key, value]) => {
      value = toValue(value)
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v === null || v === undefined || v === '') {
            return
          }
          queryStringParts.push(`search[${encodeURIComponent(key)}][]=${encodeURIComponent(v)}`)
        
        })
        
        return
      }
      if (value === null || value === undefined || value === '') {
        return
      }
      queryStringParts.push(`search[${encodeURIComponent(key)}]=${encodeURIComponent(value)}`)
    })

    // Remove the search from _query as it's being manually handled
    delete queryObj.search
  }

  // don't include empty query params
  for (const key in queryObj) {
    if (queryObj[key] === null || queryObj[key] === undefined || queryObj[key] === '') {
      delete queryObj[key]
    }
  }
  let queryString = stringifyQuery(queryObj)

  for (const key in queryObj) {
    if (Array.isArray(toValue(queryObj[key]))) {
      const regex = new RegExp(`\\b${key}=`, 'g')

      queryString = queryString.replace(regex, `${key}[]=`)
    }
  }
  if(queryStringParts.length > 0){
    queryString = queryStringParts.join('&') + (queryString ? `&${queryString}` : '')
  }
  
  return `${_url}${queryString ? `?${queryString}` : ''}`

})
