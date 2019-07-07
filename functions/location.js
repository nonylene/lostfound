const functions = require('firebase-functions')
const googleMapsClient = require('@google/maps').createClient({
  key: functions.config().lostfound.google_map.token,
  Promise,
})

const MIN = 0.005
const MAX = 0.04

class TooLargeError extends Error {}

const biasedLen = (viewportLen) => {
  if (viewportLen < MIN) {
    return viewportLen * 1.8
  } if (viewportLen < MAX) {
    return (1 + (viewportLen - MIN) / (MAX - MIN) * 0.8) * viewportLen
  }
  return viewportLen
}

const calcScore = (viewportLen, len) => Math.max(Math.min(1, 2 - len / viewportLen), 0)

exports.locationScore = (target, location, viewportLens) => {
  const { lat, lng } = target
  const { latLen, lngLen } = viewportLens

  const latScore = calcScore(latLen, Math.abs(location.lat - lat))
  const lngScore = calcScore(lngLen, Math.abs(location.lng - lng))
  return latScore * lngScore
}

exports.convertViewPort = ({ northeast, southwest }) => {
  const latViewport = northeast.lat - southwest.lat
  const lngViewport = northeast.lng - southwest.lng

  if (latViewport > MAX || lngViewport > MAX) {
    throw new TooLargeError('Area too large')
  }

  return { latLen: biasedLen(latViewport), lngLen: biasedLen(lngViewport) }
}

exports.TooLargeError = TooLargeError

exports.getLocation = async (query) => {
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
