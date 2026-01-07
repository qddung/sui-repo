/**
 * Event types for SuiMeet meeting rooms
 * These match the Move contract event definitions
 */

// Type aliases for clarity
export type ObjectId = string;
export type SuiAddress = string;

/**
 * RoomCreated event - emitted when a new meeting room is created
 */
export interface RoomCreated {
  room_id: ObjectId;
  host: SuiAddress;
  title: Uint8Array; // UTF-8 bytes
  created_at: bigint;
}

/**
 * RoomStarted event - emitted when a meeting starts
 */
export interface RoomStarted {
  room_id: ObjectId;
  started_at: bigint;
}

/**
 * RoomEnded event - emitted when a meeting ends
 */
export interface RoomEnded {
  room_id: ObjectId;
  ended_at: bigint;
}

/**
 * GuestApproved event - emitted when a guest is approved
 */
export interface GuestApproved {
  room_id: ObjectId;
  guest: SuiAddress;
  approved_by: SuiAddress;
}

/**
 * GuestRevoked event - emitted when a guest approval is revoked
 */
export interface GuestRevoked {
  room_id: ObjectId;
  guest: SuiAddress;
  revoked_by: SuiAddress;
}

/**
 * HostCapGranted event - emitted when a new host capability is granted
 */
export interface HostCapGranted {
  room_id: ObjectId;
  new_host: SuiAddress;
  granted_by: SuiAddress;
}

/**
 * MetadataUpdated event - emitted when room metadata is updated
 */
export interface MetadataUpdated {
  room_id: ObjectId;
  updated_by: SuiAddress;
}

/**
 * Unified enum for all meeting room events
 */
export type MeetingRoomEvent =
  | { type: 'RoomCreated'; data: RoomCreated }
  | { type: 'RoomStarted'; data: RoomStarted }
  | { type: 'RoomEnded'; data: RoomEnded }
  | { type: 'GuestApproved'; data: GuestApproved }
  | { type: 'GuestRevoked'; data: GuestRevoked }
  | { type: 'HostCapGranted'; data: HostCapGranted }
  | { type: 'MetadataUpdated'; data: MetadataUpdated };

/**
 * Parse a Sui event into a strongly-typed MeetingRoomEvent
 */
export function parseMeetingRoomEvent(
  event: { type: string; packageId: string; bcs: string },
  packageId: string
): MeetingRoomEvent | null {
  // Check if event is from our package
  if (!event.packageId.startsWith(packageId)) {
    return null;
  }

  // Decode BCS bytes
  const eventBytes = Uint8Array.from(Buffer.from(event.bcs, 'base64'));

  try {
    switch (event.type) {
      case 'RoomCreated': {
        // Parse BCS data (simplified - would need proper BCS deserialization)
        // For now, this is a placeholder that would need proper BCS library
        return { type: 'RoomCreated', data: {} as RoomCreated };
      }
      case 'RoomStarted': {
        return { type: 'RoomStarted', data: {} as RoomStarted };
      }
      case 'RoomEnded': {
        return { type: 'RoomEnded', data: {} as RoomEnded };
      }
      case 'GuestApproved': {
        return { type: 'GuestApproved', data: {} as GuestApproved };
      }
      case 'GuestRevoked': {
        return { type: 'GuestRevoked', data: {} as GuestRevoked };
      }
      case 'HostCapGranted': {
        return { type: 'HostCapGranted', data: {} as HostCapGranted };
      }
      case 'MetadataUpdated': {
        return { type: 'MetadataUpdated', data: {} as MetadataUpdated };
      }
      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to parse event ${event.type}:`, error);
    return null;
  }
}

