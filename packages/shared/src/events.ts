// Socket.IO event names shared by web and server (DESIGN §7).
export const EV = {
  roomJoin: 'room:join',
  roomLeave: 'room:leave',
  chatSend: 'chat:send',
  chatMessage: 'chat:message',
  chatHistory: 'chat:history',
  chatDeleted: 'chat:deleted',
  chatRejected: 'chat:rejected',
  reactionBatch: 'reaction:batch',
  reactionBurst: 'reaction:burst',
  pollUpdate: 'poll:update',
  pollVote: 'poll:vote',
  scoreUpdate: 'score:update',
  streamStatus: 'stream:status',
  notify: 'notify',
  modAction: 'mod:action',
} as const;

export type EventName = (typeof EV)[keyof typeof EV];
