const schedule = require("node-schedule");
const beer = require("./beer_release");

module.exports = function(controller) {
  Date.prototype.getNextWeekDay = function(d) {
    if (d) {
      var next = this;
      next.setDate(this.getDate() - this.getDay() + 7 + d);
      return next;
    }
  };

  const weeklyReminder = schedule.scheduleJob("* * * * 12 7", function(err) {
    if (err) {
      console.log(err);
    }
    const from = new Date();
    const to = from.getNextWeekDay(1);
    beer.getBeerReleases(from, to, sendMessage);
  });

  const dailyUpdate = schedule.scheduleJob("* * * 12 *", function(err) {
    if (err) {
      console.log(err);
    }
    beer.getNewReleases(new Date(), sendMessage, controller);
  });

  function sendMessage(releases) {
    console.log("sending message");
    const attachments = beer.getAttachments(releases);

    if (attachments.length > 0) {
      controller.storage.teams.all((err, teams) => {
        if (err) {
          throw new Error("Error: Could not load existing teams:", err);
        } else {
          for (const team of teams) {
            for (const incoming_webhook of team.incoming_webhooks) {
              let options = team.bot;
              options.incoming_webhook = incoming_webhook;
              const bot = controller.spawn(options);
              const message = {
                attachments: attachments
              };

              bot.sendWebhook(
                {
                  attachments: attachments
                },
                function(err, res) {
                  console.log(res);
                  if (err) {
                    console.log(err);
                  }
                  if (res === "No service") {
                    console.log(res);
                  }
                }
              );
            }
          }
        }
      });
    }
  }
};
