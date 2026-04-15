import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="secondary">Placeholder</Badge>
          </div>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : (
            <CardDescription>
              This section will host real features. Use the sidebar to explore other dummy routes.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>No data yet — safe to replace this page when you build the workflow.</p>
        </CardContent>
      </Card>
    </div>
  );
}
