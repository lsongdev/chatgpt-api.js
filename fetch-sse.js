import { createParser } from "eventsource-parser";

export async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function fetchSSE(resource, options) {
  const { onMessage, ...fetchOptions } = options;
  const res = await fetch(resource, fetchOptions);
  console.log(res.status, res.statusText);
  const parser = createParser(event => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  for await (const chunk of streamAsyncIterable(res.body)) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
}