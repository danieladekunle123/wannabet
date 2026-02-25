import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Info } from 'lucide-react';

interface InfoDialogProps {
  title: string;
  description: string;
  tips?: string[];
  variant?: 'icon' | 'button';
}

export function InfoDialog({ title, description, tips, variant = 'icon' }: InfoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 shrink-0"
          >
            <Info className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-primary" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="text-left pt-4">
            {description}
          </DialogDescription>
        </DialogHeader>

        {tips && tips.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-sm text-foreground">Quick Tips:</h4>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-2 text-sm text-muted-foreground animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-medium">{index + 1}</span>
                  </div>
                  <span className="flex-1">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={() => setOpen(false)} className="bg-primary text-primary-foreground">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
