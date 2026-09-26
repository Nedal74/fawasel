import Script from "next/script";

/** Only well-formed GA4 ids are ever written into the page. */
export function isGaId(value: string | undefined): value is string {
  return Boolean(value && /^G-[A-Z0-9]{4,16}$/.test(value));
}

/**
 * Google Analytics 4, loaded only when a measurement id is set (dashboard →
 * Settings, or NEXT_PUBLIC_GA_ID). Page views on client-side navigation are
 * picked up by GA4's enhanced measurement; conversions are sent from
 * src/lib/track-client.ts.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  if (!isGaId(id)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
