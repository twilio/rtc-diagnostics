/**
 * The following rule is necessary as having `BitrateTest` imported first causes
 * unit tests to crash.
 */
/* tslint:disable ordered-imports */

import './InputTest';
import './NetworkTest';
import './OutputTest';
import './utils';

import './BitrateTest';
