"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InitiativeForm } from "./initiative-form";
import type { Initiative } from "@/lib/initiatives/types";

export function AddInitiativeButton({
  onCreated,
}: {
  onCreated: (initiative: Initiative) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" size="sm" className="pop-lift rounded-full">
            ＋ 取り組みを追加
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>取り組みを追加</DialogTitle>
        </DialogHeader>
        <InitiativeForm
          mode="create"
          onSaved={(initiative) => {
            onCreated(initiative);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
