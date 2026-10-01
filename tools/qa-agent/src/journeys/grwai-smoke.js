// Two short journeys used to smoke-test the packaged harness (full set lives in grwai.js).
const full = require('./grwai');
module.exports = full.filter((j) => j.name === 'Onboarding (skip + resume)' || j.name === 'Keyboard navigation (web)');
