'use strict'

// process.env.DEBUG = "mediasoup*"

const logger = require('./logger')
const App    = require('./app')

const env = process.env.NODE_ENV || "development"
const config = require("./conf/" + env)

logger.configure(config.log)

const app = new App(config)

process.on('SIGINT', () => {
  logger.info("[service] shutdown...")
  app.close()
  process.exit()
})

logger.info("[service] start")

app.run()


