import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">Global configuration for the Intelligence Platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Thresholds</CardTitle>
          <CardDescription>Default settings applied to new groups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg border">
            <div>
              <div className="font-semibold text-sm">Mute Threshold</div>
              <div className="text-sm text-muted-foreground">Warnings before automatic mute</div>
            </div>
            <div className="font-mono">5</div>
          </div>
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg border">
            <div>
              <div className="font-semibold text-sm">Ban Threshold</div>
              <div className="text-sm text-muted-foreground">Warnings before automatic ban</div>
            </div>
            <div className="font-mono">10</div>
          </div>
          <Button disabled className="mt-4">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
