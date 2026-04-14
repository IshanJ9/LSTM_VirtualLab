import axios from 'axios'

const BASE = '/api'

const api = axios.create({ baseURL: BASE, timeout: 15000 })

export const getDatasets    = ()              => api.get('/datasets').then(r => r.data)
export const getSimulation  = (dataset)       => api.get(`/simulate?dataset=${dataset}`).then(r => r.data)
export const getAnalysis    = (dataset)       => api.get(`/analysis?dataset=${dataset}`).then(r => r.data)
export const postCounterfactual = (payload)   => api.post('/counterfactual', payload).then(r => r.data)

export default api
