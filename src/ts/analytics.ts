interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  _linkedin_data_partner_ids?: string[];
  _linkedin_partner_id?: string;
  lintrk?: ((a: string, b: unknown) => void) & { q?: unknown[] };
}
const w = window as AnalyticsWindow;

w.dataLayer = w.dataLayer || [];
function gtag(...args: unknown[]): void { w.dataLayer!.push(args); }
gtag('js', new Date());
gtag('config', 'G-RVD8TGQLHK');

const gaScript = document.createElement('script');
gaScript.async = true;
gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-RVD8TGQLHK';
document.head.appendChild(gaScript);

w._linkedin_partner_id = '8671618';
w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
w._linkedin_data_partner_ids.push(w._linkedin_partner_id);

if (!w.lintrk) {
  w.lintrk = function(a: string, b: unknown) { w.lintrk!.q!.push([a, b]); } as AnalyticsWindow['lintrk'];
  w.lintrk!.q = [];
}
const liScript = document.createElement('script');
liScript.type = 'text/javascript';
liScript.async = true;
liScript.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
document.head.appendChild(liScript);
