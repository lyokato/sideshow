'use strict'

const http       = require("http")
const https      = require("https")
const fs         = require('fs');
const express    = require('express')
const bodyParser = require('body-parser')
const SMSPServer = require("./smsp/server")
const logger     = require("./logger")
const Fetcher    = require("./fetcher");

module.exports = class App {

  constructor(config) {

    this._config     = config.http
    this._httpServer = this._createHTTPServer(config.http)
    this._fetcher    = new Fetcher();

    const app = express()

    app.set('views', __dirname + '/../views')
    app.set('view engine', 'ejs')

    app.use(express.static(__dirname + '/../public'))
    app.use(bodyParser.json())

    app.get('/', (req, res) => {
      res.render('index.ejs', {
        host:                    config.http.host,
        port:                    config.http.port,
        directRTCUseMediaServer: config.media.directRTCUseMediaServer ? "true" : "false",
      })
    })

    app.get('/fetch', (req, res) => {
      logger.info("[api] [fetch] new request");
      res.contentType("application/json");
      if (req.query.url) {
        logger.info("[api] [fetch] start to fetch");
        this._fetcher.fetch(req.query.url)
          .then(result => {
            logger.info("[api] [fetch] result");
            res.send(JSON.stringify({
              result: result
            }));
          }).catch(err => {
            logger.info("[api] [fetch] error");
            res.send(JSON.stringify({
              error: "fetch_error"
            }));
          });
      } else {
        logger.info("[api] [fetch] bad_request");
        res.send(JSON.stringify({
          error: "bad_request"
        }));
      }
    })

    this._httpServer.on('request', app)

    this._smspServer = new SMSPServer({
      httpServer:  this._httpServer,
      mediaConfig: config.media,
    })
  }

  _createHTTPServer(config) {
    const options = {}
    if ("tls" in config) {
      logger.info("[signaling] found TLS setting in configuration, try to load cert and key.");
      if (!("key" in config.tls)) {
        throw new ArgumentError(
          "bad configuration: 'key' not found in 'tls' section")
      }
      if (!("cert" in config.tls)) {
        throw new ArgumentError(
          "bad configuration: 'cert' not found in 'tls' section")
      }
      options.key  = fs.readFileSync(config.tls.key)
      options.cert = fs.readFileSync(config.tls.cert)
      logger.info("[signaling] TLS prepared.");
      return https.createServer(options)
    } else {
      return http.createServer()
    }
  }

  run() {
    logger.info("[signaling] start listening port: %d", this._config.port);
    this._httpServer.listen(this._config.port)
  }

  close() {
    this._smspServer.close()
  }

}

