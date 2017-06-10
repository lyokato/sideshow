'use strict'

module.exports = {

  http: {
    tls: {
      cert: "/etc/letsencrypt/archive/example.org/fullchain1.pem",
      key: "/etc/letsencrypt/archive/example.org/privkey1.pem"
    },
    host: "example.org",
    port: 443
  },

  media: {

    server: {
      logLevel:   "debug",
      //logTags : ['info', 'ice', 'dtls',  'rtp', 'rtcp', 'srtp', 'rbe', 'rtx'],
      rtcIPv4:    true,
      rtcIPv6:    false,
      rtcAnnouncedIPv4: "<YOUR_SERVERS_GLOBAL_IP_ADDRESS>",
      rtcMinPort: 40000,
      rtcMaxPort: 49999
    },

    room: {
      mediaCodecs : [
        {
          kind        : "audio",
          name        : "audio/opus",
          clockRate   : 48000,
          payloadType : 100
        },
        {
          kind        : "video",
          name        : "video/vp8",
          clockRate   : 90000,
          payloadType : 120
        },
        {
          kind        : "video",
          name        : "video/vp9",
          clockRate   : 90000,
          payloadType : 123
        },
        {
          kind        : "video",
          name        : "video/H264",
          clockRate   : 90000,
          payloadType : 126,
          parameters  :
          {
            packetizationMode : 1
          }
        }
      ]
    },

    transport: {
      udp: true,
      tcp: true,
      // preferIPv4,
      // preferIPv6,
      // preferUdp
      // preferTcp
    },

    maxBitrate: 500000,

    directRTCUseMediaServer: false,

  },

  log: {
    appenders: [
      {
        "type":     "console",
        "category": "sideshow",
        "filename": "logs/proxy.log",
        "pattern":  "-yyyy-MM-DD"
      }
    ]
  }
}
