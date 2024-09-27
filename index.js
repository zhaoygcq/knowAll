import { WechatyBuilder, ScanStatus } from "wechaty";
import { FileBox } from "file-box";
import { send } from "./tts-ws-node.js";
import qrcodeTerminal from "qrcode-terminal";

const MY_NAME = "helloworld";


function onScan(qrcode, status) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      "https://wechaty.js.org/qrcode/",
      encodeURIComponent(qrcode),
    ].join("");
    console.info(
      "StarterBot",
      "onScan: %s(%s) - %s",
      ScanStatus[status],
      status,
      qrcodeImageUrl
    );

    qrcodeTerminal.generate(qrcode, { small: true }); // show qrcode on console
  } else {
    console.info("StarterBot", "onScan: %s(%s)", ScanStatus[status], status);
  }
}

const handleMsg = async (msg) => {
  if (msg && msg.includes(`@${MY_NAME}`)) {
    // 文本内容替换，即去除 @helloworld
    const content = msg.replace(`@${MY_NAME}`, "");
    await send(content);
    const buffer = FileBox.fromFile("./test.mp3");
    return buffer;
  }
  return null;
};

const bot = WechatyBuilder.build({
  name: MY_NAME,
});

bot
  .on("scan", onScan)
  .on("login", (user) => console.log("登录成功：" + user))
  .on("message", async (message) => {
    const content = message.text();
    console.log(content, "+++++++MESSAGE+++++");
    const buffer = await handleMsg(content);
    buffer && message.say(buffer);
  })
  .start()
  .then(() => console.info("StarterBot", "Starter Bot Started."))
  .catch((e) => console.error("StarterBot", e));
// 创建 agent 实例
// const agent = new WechatferryAgent();

// 监听微信消息
// agent.on("message", async (msg) => {
//   console.log(msg, "+++++++MESSAGE+++++");
//   // 识别文字，转成语音
//   if (msg.content && msg.content.includes(`@${MY_NAME}`)) {
//     const buffer = await handleMsg(msg.content);
//     agent.sendFile(msg.roomid, buffer);
//     console.log("send tts", buffer);
//   }
// });

// // 启动 wcf
// agent.start();
