import { Card, CardContent } from '@/components/ui/card';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';

export function HomePage() {
  return (
    <div className="container">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle>Home</ToolbarPageTitle>
        </ToolbarHeading>
      </Toolbar>
      <Card>
        <CardContent className="py-12">
          <h2 className="text-lg font-medium">Welcome to Expense Tracker</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your personal workspace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
