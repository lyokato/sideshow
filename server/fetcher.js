const MetaInspector = require("node-metainspector");

module.exports = class Fetcher {

  // TODO cache result
  constructor() {
  }

  fetch(url) {
    return new Promise((resolve, reject) => {
      const client = new MetaInspector(url, {timeout: 5000});
      client.on("fetch", () => {
        const title = client.ogTitle || client.title || url;
        const desc = client.oDescription || client.description || client.title;
        resolve({
          title:       title,
          description: desc,
          image:       client.image,
        });
      });
      client.on("error", (err) => {
        reject(err);
      });
      client.fetch();
    })
  }
}
