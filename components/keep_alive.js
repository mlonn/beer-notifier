const http = require("http");

module.exports = function(webserver) {
  function refresh() {
    const url = `http://${webserver.get("url")}`;
    http.get(url, res => {
      const { statusCode } = res;
      console.log(`GET: ${statusCode} -> ${url}`);
    });
  }
  setInterval(refresh, 300000); // every 5 minutes (300000)
  return refresh;
};
