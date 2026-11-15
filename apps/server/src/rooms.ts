/** Socket.IO room for one stream (chat, reactions, polls, score). */
export const roomOf = (streamId: string) => `stream:${streamId}`;
