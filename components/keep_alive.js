const http = require("http");
const schedule = require("node-schedule");

module.exports = webserver => {
  const dailyUpdate = schedule.scheduleJob("*/15 * * * *", err => {
    const url = `http://${webserver.get("url")}`;
    http.get(url, res => {
      const { statusCode } = res;
      console.log(`GET: ${statusCode} -> ${url}`);
    });
  });
};
