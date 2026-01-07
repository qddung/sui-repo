// Types for JWT payload
export interface JWTPayload {
  sub: string; // user ID
  wal: string; // wallet address
  sid: string; // session ID
  ekey?: string; // ephemeral key ID (optional)
  scope?: string; // comma-separated scopes
  iat: number;
  exp: number;
}

// Types for session management
export interface SessionData {
  userId: string;
  walletId: string;
  walletAddress: string;
  walletType: 'sui' | 'zklogin';
}

// Types for ephemeral key scopes
export type EphemeralKeyScope =
  | 'room:create'
  | 'room:approve'
  | 'room:revoke'
  | 'room:join'
  | 'room:leave'
  | 'poap:mint';

// Types for auto-signing requests
export interface AutoSignRequest {
  sessionId: string;
  txPayload: string; // Base64 encoded transaction
  scope: EphemeralKeyScope[];
}

export interface AutoSignResponse {
  signature: string;
  publicKey: string;
  txDigest?: string;
}

// Types for room operations
export interface CreateRoomRequest {
  title: string;
  description?: string;
  maxParticipants?: number;
  initialParticipants: string[];
  requireApproval: boolean;
  walletAddress: string;
  onchainObjectId: string;
  hostCapId?: string;
}

export interface ApproveGuestRequest {
  roomId: string;
  guestAddress: string;
}

export interface SealApproveRequest {
  roomId: string;
  guestAddress: string; // BCS encoded address
}

