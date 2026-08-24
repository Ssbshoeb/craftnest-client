export default {
  namespaced: true,
  state: {
    errors: {},
    status: null,
  },
  getters: {
    getErrors (state) {
      return state.errors
    },
    getStatus (state) {
      return state.status
    },
  },
  mutations: {
    SET_ERRORS (state, data) {
      state.errors = data
    },
    SET_STATUS (state, data) {
      state.status = data
    },
  },
  actions: {
    setErrors ({ commit }, errors) {
      commit('SET_ERRORS', errors)
    },
    setStatus ({ commit }, status) {
      commit('SET_STATUS', status)
    },
  },
}