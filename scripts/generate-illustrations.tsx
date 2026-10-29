import React from "react";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AdminLoginScene,
  AlertScene,
  AnalyticsScene,
  CrowdedWaitingRoomScene,
  EmergencyScene,
  FairQueueScene,
  HeroQueueScene,
  HindiVoiceScene,
  MapCompareScene,
  OrgLoginScene,
  PredictionScene,
  SmoothServiceScene,
  StepFindIllo,
  StepJoinIllo,
  StepServedIllo,
  StepTrackIllo,
  TicketScene,
  UserLoginScene,
} from "../components/illustrations-source";

const illustrations = [
  ["hero-queue", HeroQueueScene],
  ["crowded-waiting-room", CrowdedWaitingRoomScene],
  ["smooth-service", SmoothServiceScene],
  ["user-login", UserLoginScene],
  ["org-login", OrgLoginScene],
  ["admin-login", AdminLoginScene],
  ["prediction", PredictionScene],
  ["map-compare", MapCompareScene],
  ["ticket", TicketScene],
  ["alert", AlertScene],
  ["hindi-voice", HindiVoiceScene],
  ["analytics", AnalyticsScene],
  ["emergency", EmergencyScene],
  ["fair-queue", FairQueueScene],
  ["step-find", StepFindIllo],
  ["step-join", StepJoinIllo],
  ["step-track", StepTrackIllo],
  ["step-served", StepServedIllo],
] as const;

const outDir = path.join(process.cwd(), "public", "illustrations");
mkdirSync(outDir, { recursive: true });

for (const [slug, Component] of illustrations) {
  const markup = renderToStaticMarkup(<Component />);
  writeFileSync(path.join(outDir, `${slug}.svg`), markup, "utf8");
  console.log(`wrote ${slug}.svg (${markup.length} bytes)`);
}
