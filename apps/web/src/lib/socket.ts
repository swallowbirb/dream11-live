import { io, type Socket } from 'socket.io-client';
import { useSession } from './session';

// One shared connection, re-created when the session token changes. Same origin: Vite proxies /socket.io.
let socket: Socket | null = null;
let socketToken: string | null = null;

export function getSocket(): Socket {
  const token = useSession.getState().token;
  if (!socket || socketToken !== token) {
    socket?.disconnect();
    socket = io({ auth: { token } });
    socketToken = token;
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
