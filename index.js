const MY_NAME = "helloworld";

const knowAll = async () => {
  const { WechatferryAgent } = await import("@wechatferry/agent");
  const { FileBox } = await import("file-box");
  const { send } = await import("./tts-ws-node.js");
  // 创建 agent 实例
  const agent = new WechatferryAgent();

  // 监听微信消息
  agent.on("message", async (msg) => {
    console.log(msg, "+++++++MESSAGE+++++");
    // 识别文字，转成语音
    if (msg.content && msg.content.includes(`@${MY_NAME}`)) {
      // 文本内容替换，即去除 @helloworld
      const content = msg.content.replace(`@${MY_NAME}`, "");
      await send(content);
      const buffer = FileBox.fromFile("./test.mp3");
      agent.sendFile(msg.roomid, buffer);
      console.log("send tts", buffer)
    }
  });

  // 启动 wcf
  agent.start();
};

knowAll();
