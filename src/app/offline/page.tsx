import { SoftShell } from "@/components/SoftShell";
import { WifiOff } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function OfflinePage() {
  return (
    <SoftShell>
      <Empty className="relative z-[1] mx-auto w-full max-w-md animate-fade-up py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WifiOff aria-hidden />
          </EmptyMedia>
          <EmptyTitle>You&apos;re offline</EmptyTitle>
          <EmptyDescription>
            Habitat will be here when the connection comes home.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </SoftShell>
  );
}
