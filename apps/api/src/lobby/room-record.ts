import { randomBytes } from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import type { RoomDto, RoomSettingsDto } from "@cryptopoker/contracts";

export type RoomRecord = RoomDto & {
  joinedPlayerIds: Set<string>;
};

const EXCLUDED_PUBLIC_LAUNCH_FEATURES = [
  "tournaments",
  "multi-table-play",
  "fiat-ramps",
  "token-swaps",
  "referrals",
  "rake",
] as const;

export function normalizeRoomSettings(settings: RoomSettingsDto): RoomSettingsDto {
  if (!settings.name?.trim()) throw new BadRequestException({ code: "ROOM_NAME_REQUIRED", message: "Room name is required." });
  if (settings.smallBlind <= 0 || settings.bigBlind <= settings.smallBlind) {
    throw new BadRequestException({ code: "INVALID_BLINDS", message: "Big blind must be larger than the small blind." });
  }
  if (settings.buyInMin <= 0 || settings.buyInMax < settings.buyInMin) {
    throw new BadRequestException({ code: "INVALID_BUY_IN_RANGE", message: "Buy-In range is invalid." });
  }
  if (settings.seatCount < 2 || settings.seatCount > 10) {
    throw new BadRequestException({ code: "INVALID_SEAT_COUNT", message: "Seat count must be between 2 and 10." });
  }
  if (settings.actionTimerSeconds < 10) {
    throw new BadRequestException({ code: "INVALID_ACTION_TIMER", message: "Action timer must be at least 10 seconds." });
  }

  const mode = settings.mode ?? "blockchain-backed";
  if (mode !== "host-verified" && mode !== "blockchain-backed") {
    throw new BadRequestException({ code: "INVALID_ROOM_MODE", message: "Room mode must be host-verified or blockchain-backed." });
  }

  const blockchain = mode === "blockchain-backed"
    ? {
        network: "base" as const,
        stablecoin: "USDC" as const,
        maxTotalBuyIn: Math.max(settings.buyInMax, settings.blockchain?.maxTotalBuyIn ?? settings.buyInMax),
        antiRatholing: settings.blockchain?.antiRatholing ?? true,
        noRake: true,
        compliance: {
          allowedJurisdictions: settings.blockchain?.compliance?.allowedJurisdictions?.length
            ? settings.blockchain.compliance.allowedJurisdictions.map((value) => value.trim().toUpperCase()).filter(Boolean)
            : ["US-CA"],
          publicAccess: settings.blockchain?.compliance?.publicAccess ?? "closed-alpha",
          screeningMode: settings.blockchain?.compliance?.screeningMode ?? "require-clear",
        },
        launch: {
          testnetStatus: settings.blockchain?.launch?.testnetStatus ?? "pending",
          closedAlphaEnabled: settings.blockchain?.launch?.closedAlphaEnabled ?? false,
          auditStatus: settings.blockchain?.launch?.auditStatus ?? "pending",
          legalReviewStatus: settings.blockchain?.launch?.legalReviewStatus ?? "pending",
          monitoringStatus: settings.blockchain?.launch?.monitoringStatus ?? "pending",
          emergencyControlsStatus: settings.blockchain?.launch?.emergencyControlsStatus ?? "pending",
          trustDisclosuresStatus: settings.blockchain?.launch?.trustDisclosuresStatus ?? "pending",
          supportEvidenceStatus: settings.blockchain?.launch?.supportEvidenceStatus ?? "pending",
          excludedFeatures: [...EXCLUDED_PUBLIC_LAUNCH_FEATURES],
          currentStage: "testnet" as const,
          publicLaunchBlockedReasons: [],
        },
      }
    : null;

  if (mode === "blockchain-backed" && settings.blockchain?.noRake === false) {
    throw new BadRequestException({ code: "RAKE_FORBIDDEN", message: "Blockchain-Backed Rooms must keep no-rake enabled in v1." });
  }

  if (blockchain) {
    if (blockchain.launch.closedAlphaEnabled && blockchain.launch.testnetStatus !== "stable") {
      throw new BadRequestException({
        code: "TESTNET_STABILITY_REQUIRED",
        message: "Closed alpha cannot open until Base Sepolia stability is marked stable.",
      });
    }

    const publicLaunchBlockedReasons: string[] = [];
    if (!blockchain.launch.closedAlphaEnabled) {
      publicLaunchBlockedReasons.push("Closed alpha feature flag must be enabled before public launch.");
    }
    if (blockchain.launch.testnetStatus !== "stable") {
      publicLaunchBlockedReasons.push("Base Sepolia stability must be marked stable before public launch.");
    }
    if (blockchain.launch.auditStatus !== "complete") {
      publicLaunchBlockedReasons.push("External audit remediation must be complete before public launch.");
    }
    if (blockchain.launch.legalReviewStatus !== "complete") {
      publicLaunchBlockedReasons.push("Legal review must be complete before public launch.");
    }
    if (blockchain.launch.monitoringStatus !== "ready") {
      publicLaunchBlockedReasons.push("Monitoring and anomaly alerts must be ready before public launch.");
    }
    if (blockchain.launch.emergencyControlsStatus !== "ready") {
      publicLaunchBlockedReasons.push("Pause, Settlement Frozen, and Emergency Exit controls must be ready before public launch.");
    }
    if (blockchain.launch.trustDisclosuresStatus !== "ready") {
      publicLaunchBlockedReasons.push("Trust-model disclosures must be ready before public launch.");
    }
    if (blockchain.launch.supportEvidenceStatus !== "ready") {
      publicLaunchBlockedReasons.push("Support evidence and rollback procedures must be ready before public launch.");
    }
    if (blockchain.compliance.screeningMode !== "require-clear") {
      publicLaunchBlockedReasons.push("Public launch requires clear-wallet screening.");
    }
    if (blockchain.compliance.allowedJurisdictions.length === 0) {
      publicLaunchBlockedReasons.push("Public launch requires at least one allow-listed jurisdiction.");
    }

    blockchain.launch.currentStage = blockchain.compliance.publicAccess === "public-enabled"
      ? "public-launch"
      : blockchain.launch.closedAlphaEnabled
        ? "closed-alpha"
        : "testnet";
    blockchain.launch.publicLaunchBlockedReasons = publicLaunchBlockedReasons;

    if (blockchain.compliance.publicAccess === "public-enabled" && publicLaunchBlockedReasons.length > 0) {
      throw new BadRequestException({
        code: "PUBLIC_LAUNCH_BLOCKED",
        message: `Public launch is blocked: ${publicLaunchBlockedReasons.join(" ")}`,
      });
    }
  }

  return {
    ...settings,
    name: settings.name.trim(),
    mode,
    blockchain,
  };
}

export function createInviteCode(): string {
  return randomBytes(24).toString("base64url");
}

export function toRoomDto(room: RoomRecord): RoomDto {
  return {
    id: room.id,
    hostPlayerId: room.hostPlayerId,
    tableId: room.tableId,
    inviteCode: room.inviteCode,
    settings: { ...room.settings },
    hasStarted: room.hasStarted,
    players: room.players.map((player) => ({ ...player })),
    buyIns: room.buyIns.map((buyIn) => ({ ...buyIn })),
    seats: room.seats.map((seat) => ({ ...seat })),
    waitlist: room.waitlist.map((entry) => ({ ...entry })),
    seatOffers: room.seatOffers.map((offer) => ({ ...offer })),
  };
}
