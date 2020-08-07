// tslint:disable only-arrow-functions

import * as sinon from 'sinon';

/**
 * Import all tests.
 */
import './AudioInputTest';
import './AudioOutputTest';

/**
 * Recommended by Sinon.JS to prevent memory leaks.
 */
afterEach(function() {
  sinon.restore();
});
