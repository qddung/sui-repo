import { Injectable } from '@nestjs/common';

// In-memory signaling store (development only)
type Candidate = any;
interface RoomSignals {
  offer?: { sdp: string; timestamp: number };
  answer?: { sdp: string; timestamp: number };
  hostCandidates: Candidate[];
  guestCandidates: Candidate[];
}

@Injectable()
export class SignalingService {
  private rooms: Record<string, RoomSignals> = {};

  private ensureRoom(roomId: string): RoomSignals {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = { hostCandidates: [], guestCandidates: [] };
    }
    return this.rooms[roomId];
  }

  setOffer(roomId: string, sdp: string) {
    const r = this.ensureRoom(roomId);
    r.offer = { sdp, timestamp: Date.now() };
    return { ok: true };
  }

  getOffer(roomId: string) {
    const r = this.rooms[roomId];
    if (!r?.offer) {
      return null;
    }
    return r.offer;
  }

  setAnswer(roomId: string, sdp: string) {
    const r = this.ensureRoom(roomId);
    r.answer = { sdp, timestamp: Date.now() };
    return { ok: true };
  }

  getAnswer(roomId: string) {
    const r = this.rooms[roomId];
    if (!r?.answer) {
      return null;
    }
    return r.answer;
  }

  addCandidate(roomId: string, candidate: Candidate, from: 'host' | 'guest') {
    const r = this.ensureRoom(roomId);
    if (from === 'host') {
      r.hostCandidates.push(candidate);
    } else {
      r.guestCandidates.push(candidate);
    }
    return { ok: true };
  }

  getCandidates(roomId: string, role: 'host' | 'guest') {
    const r = this.rooms[roomId];
    if (!r || !role) {
      return null;
    }
    // role param indicates which role's candidates to FETCH (the remote peer)
    // if role=host is requested, return guestCandidates (host wants guest's candidates)
    // if role=guest is requested, return hostCandidates (guest wants host's candidates)
    const list = role === 'host' ? r.guestCandidates : r.hostCandidates;
    // return and clear to avoid duplicates
    const out = [...list];
    if (role === 'host') {
      r.guestCandidates = [];
    } else {
      r.hostCandidates = [];
    }
    return { candidates: out };
  }

  getDebugInfo(roomId: string) {
    const r = this.rooms[roomId];
    if (!r) {
      return { error: 'Room not found', roomId };
    }
    return {
      roomId,
      hasOffer: !!r.offer,
      hasAnswer: !!r.answer,
      hostCandidatesCount: r.hostCandidates.length,
      guestCandidatesCount: r.guestCandidates.length,
      offer: r.offer,
      answer: r.answer,
    };
  }

  endCall(roomId: string, role?: 'host' | 'guest') {
    if (!this.rooms[roomId]) {
      return { ok: true, message: 'Room already cleaned up' };
    }

    // If host ends the call, clean up the entire room
    // If guest leaves, just acknowledge (room data remains for other participants)
    if (role === 'host') {
      delete this.rooms[roomId];
      return { ok: true, message: 'Room cleaned up' };
    } else {
      return { ok: true, message: 'Guest left' };
    }
  }
}

