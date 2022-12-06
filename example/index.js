import { ChatGPT } from '../index.mjs';

(async () => {
    const chat = new ChatGPT({
        sessionToken: ``
    })
    const answer = await chat.getAnswer("hello world");
    console.log(answer);
})();