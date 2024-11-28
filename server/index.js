// ===========================================
// Wiki.js
// Licensed under AGPLv3
// ===========================================

const path = require('path')
const { nanoid } = require('nanoid')
const { DateTime } = require('luxon')
const { gte } = require('semver')

// ----------------------------------------
// Init WIKI instance
// ----------------------------------------

let WIKI = {
  IS_DEBUG: process.env.NODE_ENV === 'development',
  IS_MASTER: true,
  ROOTPATH: process.cwd(),
  INSTANCE_ID: nanoid(10),
  SERVERPATH: path.join(process.cwd(), 'server'),
  Error: require('./helpers/error'),
  configSvc: require('./core/config'),
  kernel: require('./core/kernel'),
  startedAt: DateTime.utc()
}
global.WIKI = WIKI

WIKI.configSvc.init()

// ----------------------------------------
// Init checkmk
// ----------------------------------------

let check = require('checkmk');
let options = { host: '0.0.0.0', port: 6556, encoding : 'utf8', exclusive: true }
check.createServer(options);
check.addService('wikijs', 
  {
    name: 'wikijs',
    ok: 'Ok',
    warning: 'Warning',
    critical: 'Critical error',
    counters: {
      'status': '0;1;2;0;2'
    }
  })
// ----------------------------------------
// Init Logger
// ----------------------------------------

WIKI.logger = require('./core/logger').init('MASTER')

// ----------------------------------------
// Start Kernel
// ----------------------------------------

WIKI.kernel.init()

// ----------------------------------------
// Register exit handler
// ----------------------------------------

process.on('SIGTERM', () => {
  check.updateService('wikijs', {
    'status': 2
  }, "WikiJS shutting down")
  WIKI.kernel.shutdown()
})
process.on('SIGINT', () => {
  check.updateService('wikijs', {
    'status': 2
  }, "WikiJS shutting down")
  WIKI.kernel.shutdown()
})
process.on('message', (msg) => {
  if (msg === 'shutdown') {
    check.updateService('wikijs', {
      'status': 2
    }, "WikiJS shutting down")
    WIKI.kernel.shutdown()
  }
})
