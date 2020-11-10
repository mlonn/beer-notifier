const schedule = require("node-schedule");
const beer = require("./beer_release");

module.exports = controller => {
  Date.prototype.getNextWeekDay = d => {
    if (d) {
      var next = this;
      next.setDate(this.getDate() - this.getDay() + 7 + d);
      return next;
    }
  };

  const weeklyReminder = schedule.scheduleJob(" * 12 * * 7", err => {
    if (err) {
      console.log(err);
    }
    const from = new Date();
    const to = from.getNextWeekDay(1);
    beer.getBeerReleases(from, to, releases => {
      const messages = beer.getMessages(releases);

      for (message of messages) {
        sendMessage(message);
      }
    });
  });

  const dailyUpdate = schedule.scheduleJob(" 0 12 * * *", err => {
    if (err) {
      console.log(err);
    }
    console.log("Running daily update");
    beer.getNewReleases(new Date(), controller, releases => {
      const messages = beer.getMessages(releases);
      for (message of messages) {
        sendMessage(message);
      }
    });
  });

  function sendMessage(message) {
    if (message.text || message.attachments.length > 0) {
      console.log("sending message");
      controller.storage.teams.all((err, teams) => {
        if (err) {
          throw new Error("Error: Could not load existing teams:", err);
        } else {
          for (const team of teams) {
            for (const incoming_webhook of team.incoming_webhooks) {
              let options = team.bot;
              options.incoming_webhook = incoming_webhook;
              const bot = controller.spawn(options);
              bot.sendWebhook(message, (err, res) => {
                console.log(res);
                if (err) {
                  console.log(err);
                }
                if (res === "No service") {
                  console.log(res);
                }
              });
            }
          }
        }
      });
    }
  }
};
