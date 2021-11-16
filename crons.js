import schedule from "node-schedule";

const Message = "./models/Message";

const job = schedule.scheduleJob("32 * * * *", function () {
  const messages = await Message.find();
  console.log(messages);
  console.log("The answer to life, the universe, and everything!");
});

export default job;
