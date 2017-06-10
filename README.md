# SIDESHOW

This is just my playground for WebRTC group conversation with MediaSoup (NOT A STABLE APPLICATION)

Currently, works on Google Chrome only.

## Screenshots

### Group Chat

<img src="https://s3-ap-northeast-1.amazonaws.com/webrtc-sideshow/sideshow_chat.png" width="600" height="450" alt="Group Chat Image" title="Group Chat">

### Choose Mode for Video/Audio Conversation

<img src="https://s3-ap-northeast-1.amazonaws.com/webrtc-sideshow/sideshow_choose_mode.png" width="600" height="450" alt="Choose Mode Image" title="Choose Mode">

### Starting Video Chat

<img src="https://s3-ap-northeast-1.amazonaws.com/webrtc-sideshow/sideshow_1person.png" width="600" height="450" alt="Group Chat Image" title="Group Chat">

### Talking Together

<img src="https://s3-ap-northeast-1.amazonaws.com/webrtc-sideshow/sideshow_3people.png" width="600" height="450" alt="Group Chat Image" title="Group Chat">

## GETTING STARTED

### 1. Prepare your service's domain-name and its TLS cert/key files

setup them in server/conf/*.js

Here is an example with [Let's Encrypt](https://letsencrypt.org/)

Replace *example.org* with your domain.

```javascript
  http: {
    tls: {
      cert: "/etc/letsencrypt/archive/example.org/fullchain1.pem",
      key: "/etc/letsencrypt/archive/example.org/privkey1.pem"
    },
    host: "example.org",
    port: 443
  },
```

### 2. Set the server's global IP address

**media** part in config file is just a MediaSoup's configuration.

See https://mediasoup.org/api/

If your service is running behind NAT, you need to set public IP address in server/conf/*.js

write following parameters correctly.

- rtcAnnouncedIPv4
- rtcAnnouncedIPv6

Here is an example.

```javascript
  media: {
    server: {
      logLevel:   "info",
      rtcIPv4:    true,
      rtcIPv6:    false,
      rtcAnnouncedIPv4: "<PUBLIC_IP_HERE>",
      rtcMinPort: 40000,
      rtcMaxPort: 49999
    },
```

### 3. Confirm the ports is open.

Check your firewall. (If you're using AWS, SecurityGroup setting)

<img src="https://s3-ap-northeast-1.amazonaws.com/webrtc-sideshow/security_group.png" width="600" height="145" alt="Security Group Example Image" title="Security Group Example" border="2">

### 4. Resolve Dependencies

according to Node manner, install node packages written in package.json

```
npm install
```

### 5. Build Client part

```
webpack
```

### 6. Run

```
sudo node ./server/main.js --harmony
```

## SEE ALSO

- https://nodejs.org/en/
- https://mediasoup.org/
- https://facebook.github.io/react/

## LICENSE

chat-lite is provided under [The MIT License](https://raw.githubusercontent.com/sta/websocket-sharp/master/LICENSE.txt).
