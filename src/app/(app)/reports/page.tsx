'use client';

import React from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import { Badge, Button, Spinner, Card } from '@/components/ui';
import { fmt } from '@/lib/calculations';

export default function ReportsPage() {
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Demo reports
    setReports([
      { id: 'r1', vehicleId: 'demo-v-000', vehicle: '2020 BMW 3 Series', recommendation: 'BUY', dealScore: 78, generatedAt: new Date(Date.now() - 86400000).toISOString(), version: 1, sizeBytes: 245000 },
      { id: 'r2', vehicleId: 'demo-v-001', vehicle: '2019 Mercedes C-Class', recommendation: 'CONSIDER', dealScore: 52, generatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), version: 1, sizeBytes: 198000 },
      { id: 'r3', vehicleId: 'demo-v-002', vehicle: '2021 Audi Q5', recommendation: 'BUY', dealScore: 81, generatedAt: new Date(Date.now() - 5 * 86400000).toISOString(), version: 2, sizeBytes: 312000 },
      { id: 'r4', vehicleId: 'demo-v-003', vehicle: '2018 Volkswagen Passat', recommendation: 'DROP', dealScore: 28, generatedAt: new Date(Date.now() - 10 * 86400000).toISOString(), version: 1, sizeBytes: 178000 },
    ]);
    setLoading(false);
  }, []);

  async function downloadReport(vehicleId: string, vehicle: string) {
    try {
      const res = await fetch(`/api/reports/${vehicleId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apexvalue-report-${vehicle.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not generate PDF. Make sure vehicles are seeded.');
    }
  }

  const recColors = { BUY: 'buy', CONSIDER: 'consider', DROP: 'drop' } as const;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-gulf-orange" /> Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{reports.length} investment reports generated</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-12 bg-gulf-blue/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gulf-powder" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-200 truncate">{r.vehicle}</p>
                  <Badge variant={recColors[r.recommendation as keyof typeof recColors] ?? 'default'}>
                    {r.recommendation}
                  </Badge>
                  <span className="badge bg-slate-700/40 text-slate-500 border border-slate-600/30 text-xs">v{r.version}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Score: <span className="text-slate-300 font-medium">{r.dealScore}</span>
                  {' · '}Generated: {new Date(r.generatedAt).toLocaleDateString()}
                  {' · '}{(r.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 flex-shrink-0"
                onClick={() => downloadReport(r.vehicleId, r.vehicle)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          ))}
        </div>
      )}

      <Card title="About PDF Reports" subtitle="Professional investment reports for dealers">
        <div className="text-sm text-slate-400 space-y-2">
          <p>Each report includes:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-500">
            <li>Cover page with deal score and BUY/CONSIDER/DROP recommendation</li>
            <li>Vehicle summary with source data and photos</li>
            <li>Market analysis with comparable prices and statistics</li>
            <li>Tax & VAT breakdown with disclaimers</li>
            <li>Full financial sheet: costs, profit scenarios, break-even, max bid</li>
            <li>Conclusion with top reasons, risks, and next steps</li>
          </ul>
          <p className="text-xs text-slate-600 mt-3">
            Reports are generated server-side. Files are stored in Cloudflare R2 when enabled, otherwise downloaded directly.
          </p>
        </div>
      </Card>
    </div>
  );
}
