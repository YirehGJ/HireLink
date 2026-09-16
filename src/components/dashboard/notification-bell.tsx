"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/firebase/firestore/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function toJsDate(v: any): Date {
  if (!v) return new Date();
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
  return new Date(v);
}

export function NotificationBell({ uid }: { uid: string | null }) {
  const { data: notifications, markAsRead } = useNotifications(uid);
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!notifications || notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground text-center">Sin notificaciones por ahora.</p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 whitespace-normal"
              onClick={() => !n.read && markAsRead(n.id)}
              asChild
            >
              <Link href={n.href ?? "#"}>
                <div className="flex items-center gap-2 w-full">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  <span className="font-medium text-sm">{n.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{n.body}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(toJsDate(n.createdAt), { addSuffix: true, locale: es })}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
