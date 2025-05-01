// src/utils/clipMessages.ts

import { Message } from "../api/memory";

export function clipMessages(messages: Message[], limit: number = 10): Message[] {
  return messages.slice(-limit);
}
