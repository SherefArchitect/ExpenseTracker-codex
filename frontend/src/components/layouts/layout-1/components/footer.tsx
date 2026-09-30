export function Footer() {
  return (
    <footer className="footer">
      <div className="container py-5 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Expense Tracker
      </div>
    </footer>
  );
}
