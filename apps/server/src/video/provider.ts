// All video calls go through this (DESIGN §5.5). Room name = stream id.
// Prototype: no webhooks; the client tells the server when it goes live / ends.
export interface VideoProvider {
  readonly url: string;
  getPublishToken(room: string, identity: string, name: string): Promise<string>;
  getViewerToken(room: string, identity: string, name: string): Promise<string>;
}
