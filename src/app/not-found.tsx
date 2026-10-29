import Link from "next/link";
import { Compass } from "lucide-react";
import { SoftShell } from "@/components/SoftShell";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <SoftShell>
      <Empty className="relative z-[1] mx-auto w-full max-w-md animate-fade-up py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass aria-hidden />
          </EmptyMedia>
          <EmptyTitle>Nothing nested here</EmptyTitle>
          <EmptyDescription>That habit wandered off.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Back home</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </SoftShell>
  );
}
