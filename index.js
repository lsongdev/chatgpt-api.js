import ExpiryMap from 'expiry-map'
import { v4 as uuidv4 } from "uuid";
import { fetchSSE } from "./fetch-sse.js";

const cache = new ExpiryMap(10 * 1000)
const KEY_ACCESS_TOKEN = "accessToken";
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'

export class ChatGPT {
  constructor({ sessionToken }) {
    this.sessionToken = sessionToken;
  }
  async getAccessToken() {
    const { sessionToken } = this;
    if (cache.get(KEY_ACCESS_TOKEN)) {
      return cache.get(KEY_ACCESS_TOKEN);
    }
    const res = await fetch("https://chat.openai.com/api/auth/session", {
      method: "GET",
      headers: {
        'user-agent': USER_AGENT,
        "accept": "text/html, application/json;",
        "cookie": `__Secure-next-auth.session-token=${sessionToken}; cf_clearance=HdcxmHGoEIEWnQg.lB5HQklrP6CBhuS1B3o5dpY8vJc-1676262884-0-1-d7ed7625.50ddf63a.d0837c6d-160;`
      },
    });
    if (res.status !== 200) {
      console.log(res.status, res.statusText);
    }
    const data = await res.json();
    if (!data.accessToken) {
      throw new Error("UNAUTHORIZED");
    }
    cache.set(KEY_ACCESS_TOKEN, data.accessToken);
    return data.accessToken;
  }
  async send(content, callback) {
    const { sessionToken } = this;
    const accessToken = await this.getAccessToken();
    const message = {
      id: uuidv4(),
      role: "user",
      content: {
        content_type: "text",
        parts: [content],
      },
    };
    const payload = {
      action: "next",
      messages: [message],
      model: "text-davinci-002-render",
      parent_message_id: uuidv4(),
    };
    fetchSSE("https://chat.openai.com/backend-api/conversation", {
      method: "POST",
      headers: {
        "accept": "text/event-stream",
        "accept-language": "en,zh-CN;q=0.9,zh;q=0.8",
        "authorization": `Bearer ${accessToken}`,
        "content-type": "application/json",
        "x-openai-assistant-app-id": "",
        "Referer": "https://chat.openai.com/chat",
        "cookie": `__Secure-next-auth.session-token=${sessionToken}; cf_clearance=HdcxmHGoEIEWnQg.lB5HQklrP6CBhuS1B3o5dpY8vJc-1676262884-0-1-d7ed7625.50ddf63a.d0837c6d-160;`
      },
      body: JSON.stringify(payload),
      onMessage: callback,
    });
  }
  async sendMessage(content) {
    const messages = [];
    return new Promise((resolve, reject) =>
      this.send(content, message => {
        if (message === "[DONE]") {
          const lastMessage = messages.pop();
          const data = JSON.parse(lastMessage);
          if (data.error) {
            reject(data.error);
          } else {
            console.log(data);
            resolve(data.message);
          }
        } else {
          messages.push(message);
        }
      })
    );
  }
  async getAnswer(question) {
    const response = await this.sendMessage(question);
    return response.content.parts[0];

  }
}
