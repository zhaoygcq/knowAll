const knowAll = async () => {
  const { WechatferryAgent } = await import("@wechatferry/agent");
  const { FileBox } = await import("file-box");
  const { send } = await import("./tts-ws-node.js");
  // 创建 agent 实例
  const agent = new WechatferryAgent();

  // 监听微信消息
  agent.on("message", async (msg) => {
    console.log(msg);
    // 识别文件，转成语音

    msg.content && send(msg.content);

    setTimeout(() => {
      const buffer = FileBox.fromFile("./test.mp3");
      agent.sendFile("wxid_yewjcamn63vt22", buffer);
    }, 1000);
  });

  // 启动 wcf
  agent.start();
};

knowAll();
