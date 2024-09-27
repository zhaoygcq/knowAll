/* Created by iflytek on 2020/03/01.
 *
 * 运行前：请先填写 appid、apiSecret、apiKey
 *
 * 在线语音合成调用demo
 * 此demo只是一个简单的调用示例，不适合用到实际生产环境中
 *
 * 在线语音合成 WebAPI 接口调用示例 接口文档（必看）：https://www.xfyun.cn/doc/tts/online_tts/API.html
 * 错误码链接：
 * https://www.xfyun.cn/document/error-code （code返回错误码时必看）
 *
 */
import CryptoJS from "crypto-js";
import WebSocket from "ws";
import fs from "fs/promises";
import child_process from "child_process";
import log from "log4node";

// 系统配置
const config = {
  // 请求地址
  hostUrl: "wss://tts-api.xfyun.cn/v2/tts",
  host: "tts-api.xfyun.cn",
  //在控制台-我的应用-在线语音合成（流式版）获取
  appid: "ce20bd34",
  //在控制台-我的应用-在线语音合成（流式版）获取
  apiSecret: "NDVjNGNjYTk1NjQ3OWVhZmU5NWE5ZjVh",
  //在控制台-我的应用-在线语音合成（流式版）获取
  apiKey: "b53e51baff3102b34c278efdc65e6548",
  uri: "/v2/tts",
};

let ws = null;
let frame = "";
let promise = null;
let resolvePromise = null;

const initHandler = () => {
  if (!ws) return;
  // 连接建立完毕，读取数据进行识别
  ws.on("open", async () => {
    log.info("websocket connect!");
    try {
      // 如果之前保存过音频文件，删除之
      await fs.access("./test.mp3");
      await fs.access("./test.pcm");
      await fs.unlink("./test.mp3");
      await fs.unlink("./test.pcm");
    } catch {}
    if (frame) {
      ws.send(frame);
    }
  });

  // 得到结果后进行处理，仅供参考，具体业务具体对待
  ws.on("message", async (data, err) => {
    if (err) {
      log.error("message error: " + err);
      return;
    }

    let res = JSON.parse(data);

    if (res.code != 0) {
      log.error(`${res.code}: ${res.message}`);
      return;
    }

    let audio = res.data.audio;
    let audioBuf = Buffer.from(audio, "base64");

    await save(audioBuf);

    if (res.code == 0 && res.data.status == 2) {
      console.log("语音合成成功");
      child_process.execSync(
        "ffmpeg -y -f s16le -ac 1 -ar 16000 -acodec pcm_s16le -i test.pcm test.mp3"
      );
      resolvePromise(true);
    }
  });

  // 资源释放
  ws.on("close", (e) => {
    log.info("connect close!", e);
  });

  // 连接错误
  ws.on("error", (err) => {
    log.error("websocket connect err: " + err);
  });
};

const createWs = () => {
  // 获取当前时间 RFC1123格式
  let date = new Date().toUTCString();
  // 设置当前临时状态为初始化

  let wssUrl =
    config.hostUrl +
    "?authorization=" +
    getAuthStr(date) +
    "&date=" +
    date +
    "&host=" +
    config.host;

  ws = new WebSocket(wssUrl);
  initHandler();
};

createWs();

// 鉴权签名
function getAuthStr(date) {
  let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`;
  let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret);
  let signature = CryptoJS.enc.Base64.stringify(signatureSha);
  let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  let authStr = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(authorizationOrigin)
  );
  return authStr;
}

// 保存文件
function save(data) {
  return fs.writeFile("./test.pcm", data, { flag: "a" });
}

// 传输数据
export function send(text) {
  createWs();
  let currFrame = {
    // 填充common
    common: {
      app_id: config.appid,
    },
    // 填充business
    business: {
      aue: "raw",
      auf: "audio/L16;rate=16000",
      vcn: "x2_xiaorong",
      // vcn: "aisjiuxu",
      tte: "UTF8",
    },
    // 填充data
    data: {
      text: Buffer.from(text).toString("base64"),
      status: 2,
    },
  };

  frame = JSON.stringify(currFrame);
  promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  return promise;
}
