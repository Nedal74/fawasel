"use client";

import { cn } from "@/lib/utils";

export type ClientLogo = { id: string; name: string; logo: string; website: string };

/**
 * Continuous horizontal logo marquee.
 *
 * The track holds the list twice and translates by exactly -50%, so the loop is
 * seamless; it pauses on hover/focus and stops entirely under reduced motion.
 */
export function ClientsMarquee({ clients }: { clients: ClientLogo[] }) {
  if (clients.length === 0) return null;

  const duration = Math.max(18, clients.length * 4.5);

  const item = (client: ClientLogo, cloned: boolean) => {
    const content = client.logo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={client.logo}
        alt={cloned ? "" : client.name}
        loading="lazy"
        decoding="async"
        className="h-10 w-auto max-w-[160px] object-contain opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
      />
    ) : (
      <span className="whitespace-nowrap text-base text-muted transition-colors duration-500 group-hover:text-accent">
        {client.name}
      </span>
    );

    return (
      <li
        key={`${client.id}-${cloned ? "clone" : "original"}`}
        aria-hidden={cloned || undefined}
        className="group flex shrink-0 items-center px-8"
      >
        {client.website ? (
          <a href={client.website} target="_blank" rel="noreferrer noopener" tabIndex={cloned ? -1 : 0}>
            {content}
          </a>
        ) : (
          content
        )}
      </li>
    );
  };

  return (
    <div
      className={cn(
        "marquee-host relative overflow-hidden border-y border-[var(--color-line)] py-8",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
      )}
    >
      <ul
        className="marquee-track flex w-max items-center"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {clients.map((client) => item(client, false))}
        {clients.map((client) => item(client, true))}
      </ul>
    </div>
  );
}
