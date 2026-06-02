import { Button } from "@/components/ui/button";
import { Settings2, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Platform Settings" 
        description="Global configuration for the Intelligence Platform."
        icon={<Settings2 className="w-8 h-8" />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <PremiumCard 
          title="Global Thresholds" 
          description="Default settings applied to new groups."
          icon={<SlidersHorizontal className="w-5 h-5" />}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-purple-200 dark:hover:border-purple-800">
              <div>
                <div className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Mute Threshold</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Warnings before automatic mute</div>
              </div>
              <div className="font-mono bg-white dark:bg-zinc-950 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">5</div>
            </div>
            <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-purple-200 dark:hover:border-purple-800">
              <div>
                <div className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Ban Threshold</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">Warnings before automatic ban</div>
              </div>
              <div className="font-mono bg-white dark:bg-zinc-950 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium">10</div>
            </div>
            <Button disabled className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md shadow-purple-500/20">Save Changes</Button>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
