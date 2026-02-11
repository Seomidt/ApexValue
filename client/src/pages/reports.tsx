import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Clock } from "lucide-react";

export default function Reports() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <FileText className="w-5 h-5" /> Reports
        </h1>
        <p className="text-sm text-muted-foreground">PDF investment reports archive</p>
      </div>

      <Card className="p-3 flex items-start gap-2 bg-accent/50">
        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="text-sm">
          <p className="font-medium">Demo Mode</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            PDF generation is available for all vehicles. In Demo Mode, reports use sample data.
            Enable Live Mode with your API keys for real market data in reports.
          </p>
        </div>
      </Card>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold">No reports generated yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Navigate to a vehicle detail page and click &quot;Generate PDF&quot; to create
          your first dealer investment report with full financial analysis.
        </p>
      </div>
    </div>
  );
}
