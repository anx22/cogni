import { useState } from "react";
import { LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const initialsFromEmail = (email?: string | null) => {
  if (!email) return "·";
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]).join("") || local.slice(0, 2)).toUpperCase();
};

const AccountDrawer = () => {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const email = session?.user?.email ?? null;
  const initials = initialsFromEmail(email);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Konto"
        className="w-8 h-8 rounded-full bg-[hsl(var(--surface-2))] hover:bg-[hsl(var(--surface-3))] text-[10px] tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors flex items-center justify-center"
      >
        {initials}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="bg-[hsl(var(--surface-1))] border-border-subtle backdrop-blur-xl w-[320px]"
        >
          <SheetHeader>
            <SheetTitle className="font-light">Konto</SheetTitle>
            <SheetDescription className="text-muted-foreground/70 break-all">
              {email ?? "—"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8 space-y-1">
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              Abmelden
            </button>
          </div>
          <p className="absolute bottom-6 left-6 right-6 text-[10px] text-muted-foreground/40 tracking-widest uppercase">
            Datenexport · bald
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AccountDrawer;
