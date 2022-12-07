# @song940/chatgpt-api

> ChatGPT API in Node.js

## Installation

```sh
~$ npm i @song940/chatgpt-api --save
```

## Example

```js
import { ChatGPT } from '@song940/chatgpt-api';

(async () => {
  const chat = new ChatGPT({
    sessionToken: `session token of cookies in browser`,
  })
  const answer = await chat.getAnswer("hello world");
  console.log(answer);
})();
```

### License

This project is licensed under the MIT license.