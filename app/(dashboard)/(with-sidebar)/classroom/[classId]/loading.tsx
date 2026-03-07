import { GeckoLoader } from '@/components/ui/gecko-loader';

export default function ClassroomLoading() {
  return (
    <section className="flex-1 min-h-[400px]">
      <GeckoLoader minHeight="min-h-[400px]" />
    </section>
  );
}
