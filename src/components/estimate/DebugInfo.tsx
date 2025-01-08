import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DebugInfoProps {
  error: string | null;
  debugInfo: any;
}

export function DebugInfo({ error, debugInfo }: DebugInfoProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>Error Processing PDF</AlertTitle>
      <AlertDescription>
        {error}
        {debugInfo && (
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">Show Debug Info</summary>
            <pre className="mt-2 p-2 bg-red-950/10 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
}