import { Shell } from "@/components/Shell";
import { LoadingState } from "@/components/States";

export default function Loading() {
  return (
    <Shell>
      <LoadingState rows={8} />
    </Shell>
  );
}
