type IlloProps = { className?: string; label?: string };

function illustration(src: string, alt: string, priority = false) {
  return function Illustration({ className, label }: IlloProps) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label ?? alt}
        width={560}
        height={400}
        className={className ? `object-contain ${className}` : "object-contain"}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
      />
    );
  };
}

export const HeroQueueScene = illustration(
  "/illustrations/hero-queue.svg",
  "A person managing a digital queue on a phone while others relax",
  true,
);

export const CrowdedWaitingRoomScene = illustration(
  "/illustrations/crowded-waiting-room.svg",
  "A crowded waiting room with long queues and wasted time",
);

export const SmoothServiceScene = illustration(
  "/illustrations/smooth-service.svg",
  "An organised service experience with a neat queue and happy customers",
);

export const UserLoginScene = illustration(
  "/illustrations/user-login.svg",
  "A customer using a phone to manage their queue securely",
);

export const OrgLoginScene = illustration(
  "/illustrations/org-login.svg",
  "Service staff managing customer queues from a dashboard",
);

export const AdminLoginScene = illustration(
  "/illustrations/admin-login.svg",
  "An administrator reviewing secure platform analytics",
);

export const PredictionScene = illustration(
  "/illustrations/prediction.svg",
  "A waiting-time prediction card with a countdown and confidence indicator",
);

export const MapCompareScene = illustration(
  "/illustrations/map-compare.svg",
  "A map comparing service centres and their waiting times",
);

export const TicketScene = illustration(
  "/illustrations/ticket.svg",
  "A digital queue ticket with a QR code and token number",
);

export const AlertScene = illustration(
  "/illustrations/alert.svg",
  "A notification alerting a customer that their turn is approaching",
);

export const HindiVoiceScene = illustration(
  "/illustrations/hindi-voice.svg",
  "Hindi language and voice search assistance",
);

export const AnalyticsScene = illustration(
  "/illustrations/analytics.svg",
  "Organisation analytics with visitor charts and peak hour insights",
);

export const EmergencyScene = illustration(
  "/illustrations/emergency.svg",
  "Emergency priority support with medical staff and clear guidance",
);

export const FairQueueScene = illustration(
  "/illustrations/fair-queue.svg",
  "A transparent and fair queue showing priority status",
);

export const StepFindIllo = illustration(
  "/illustrations/step-find.svg",
  "Find the right service centre",
);

export const StepJoinIllo = illustration(
  "/illustrations/step-join.svg",
  "Join a queue or book an appointment slot",
);

export const StepTrackIllo = illustration(
  "/illustrations/step-track.svg",
  "Track queue position and receive alerts",
);

export const StepServedIllo = illustration(
  "/illustrations/step-served.svg",
  "Check in with a QR token and get served",
);
