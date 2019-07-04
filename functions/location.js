const functions = require('firebase-functions')
const googleMapsClient = require('@google/maps').createClient({
  key: functions.config().lostfound.google_map.token,
  Promise,
})

const MIN = 0.005
const MAX = 0.04

class TooLargeError extends Error {}

const calcScore = (viewportLen, len) => {
  let biasedLen = viewportLen
  if (viewportLen < MIN) {
    biasedLen *= 1.8
  } else if (viewportLen < MAX) {
    biasedLen = (1 + (viewportLen - MIN) / (MAX - MIN) * 0.8) * viewportLen
  }
  return Math.max(Math.min(1, 2 - len / biasedLen), 0)
}

const getLocation = async (query) => {
  const response = await googleMapsClient.findPlace({
    input: query,
    inputtype: 'textquery',
    language: 'ja',
    // karasuma oike
    locationbias: functions.config().lostfound.google_map.locationbias,
    fields: 'geometry',
  }).asPromise()
  if (response.json.status !== 'OK') {
    return null
  }
  return response.json.candidates[0].geometry
}

exports.locationScore = async (target, query) => {
  const { lat, lng } = target
  const { location, viewport } = await getLocation(query)
  const { northeast, southwest } = viewport

  const latViewport = northeast.lat - southwest.lat
  const lngViewport = northeast.lng - southwest.lng
  if (latViewport > MAX || lngViewport > MAX) {
    throw new TooLargeError('Area too large')
  }

  const latLen = calcScore(latViewport, Math.abs(location.lat - lat))
  const lngLen = calcScore(lngViewport, Math.abs(location.lng - lng))
  return latLen * lngLen
}

exports.TooLargeError = TooLargeError
