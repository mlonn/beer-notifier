const debug = require("debug")("botkit:join");

module.exports = function(controller) {
  controller.on("bot_channel_join,bot_group_join", (bot, message) => {
    console.log("joined");
    controller.storage.teams.get(message.team, (err, team) => {
      if (err) {
        debug("Error: could not load team from storage system:", team, err);
      }

      if (
        team.bot.channels &&
        team.bot.channels.indexOf(message.channel) == -1
      ) {
        team.bot.channels.push(message.channel);
      } else {
        team.bot.channels = [message.channel];
      }
      controller.storage.teams.save(team, function(err, id) {
        if (err) {
          debug("Error: could not save team record:", err);
        }
      });
    });
  });
  controller.on("channel_left,group_left", (bot, message) => {
    console.log(message);
  });
};
