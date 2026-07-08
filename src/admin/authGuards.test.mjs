import assert from 'node:assert/strict';
import { isPuertoRicoCoordinate, signupEmailError } from './authGuards.js';

assert.equal(signupEmailError('student@upr.edu'), null);
assert.equal(signupEmailError('student@mayaguez.upr.edu'), null);
assert.match(signupEmailError('student@uprm.edu'), /Not able/);
assert.match(signupEmailError('student@notupr.edu'), /Not able/);

assert.equal(isPuertoRicoCoordinate({ latitude: 18.2013, longitude: -67.1452 }), true);
assert.equal(isPuertoRicoCoordinate({ latitude: 18.4655, longitude: -66.1057 }), true);
assert.equal(isPuertoRicoCoordinate({ latitude: 25.7617, longitude: -80.1918 }), false);

console.log('authGuards checks passed');
