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
    beer.checkNewReleases(new Date(), sendMessage);
  });

  function sendMessage(releases) {
    console.log("sending message");
    var attachments = beer.getAttachments(releases);
    if (attachments.length > 0) {
      controller.storage.teams.all(function(err, list) {
        if (err) {
          throw new Error("Error: Could not load existing teams:", err);
        } else {
          for (let i = 0; i < list.length; i++) {
            var bot = controller.spawn(list[i].bot);
            var message = {
              attachments: attachments
            };

            bot.sendWebhook(
              {
                attachments: attachments
              },
              function(err, res) {
                // handle error
              }
            );
          }
        }
      });
    }
  }
};
/* const weeklyReminder = schedule.scheduleJob('* * * 12 7', function(err) {
    if (err) {
      console.log(err)
    }
    const from = new Date()
    const to = new Date()
    to.setDate(from.getDate()+8)
    beer.getBeerReleases(from, to)
  })

  const dailyUpdate = schedule.scheduleJob('* * * 12 *', function(err) {
    if (err) {
      console.log(err)
    }
    beer.checkNewReleases(new Date(), sendMessage);
  })

  console.log("BOTS  " + managedBots[0])

}


    /*  sendMessage: function(releases) {
        var attachments = beer.getAttachments(releases)
        if (attachments.length > 0) {
          var timestamp = (new Date).getTime()/1000;
          bot.sendWebhook({
            attachments: attachments,
            ts: timestamp
          }, function(err, res) {
            console.log(res)
              if (err) {
                console.log(err)
              } else {
                console.log('message sent!');
              }
          });
        }
      } */
