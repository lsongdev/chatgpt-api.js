import ExpiryMap from 'expiry-map'
import { v4 as uuidv4 } from "uuid";
import { fetchSSE } from "./fetch-sse.mjs";

const cache = new ExpiryMap(10 * 1000)
const KEY_ACCESS_TOKEN = "accessToken";
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'

export class ChatGPT {
  constructor({ sessionToken }) {
    this.sessionToken = sessionToken;
  }
  async getAccessToken() {
    if (cache.get(KEY_ACCESS_TOKEN)) {
      return cache.get(KEY_ACCESS_TOKEN);
    }
    const { sessionToken } = this;
    const resp = await fetch("https://chat.openai.com/api/auth/session", {
      headers: {
        'user-agent': USER_AGENT,
        cookie: `__Secure-next-auth.session-token=${sessionToken}`,
      }
    })
    const data = await resp.json();
    if (!data.accessToken) {
      throw new Error("UNAUTHORIZED");
    }
    cache.set(KEY_ACCESS_TOKEN, data.accessToken);
    return data.accessToken;
  }
  async sendMessage(content) {
    const accessToken = await this.getAccessToken();
    const payload = {
      action: "next",
      messages: [
        {
          id: uuidv4(),
          role: "user",
          content: {
            content_type: "text",
            parts: [content],
          },
        },
      ],
      model: "text-davinci-002-render",
      parent_message_id: uuidv4(),
    };
    var messages = [];
    return new Promise((resolve, reject) => {
      fetchSSE("https://chat.openai.com/backend-api/conversation", {
        method: "POST",
        headers: {
          'user-agent': USER_AGENT,
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        onMessage(message) {
          if (message === "[DONE]") {
            const lastMessage = messages.pop();
            const data = JSON.parse(lastMessage);
            if (data.error) {
              reject(data.error);
            } else {
              // console.log(data);
              resolve(data.message);
            }
          } else {
            messages.push(message);
          }
        },
      });
    });
  }
  async getAnswer(question) {
    const response = await this.sendMessage(question);
    return response.content.parts[0];
  }
}
