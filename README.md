# Prop Firm Desk — Clickable Prototype

Standalone end-to-end UI prototype for the Prop Firm Desk MVP.

**Promise:** challenge in → Midfleet verdict → prop-safe ticket → you confirm → journal + compliance.

## Run

```bash
cd prop-desk-prototype
npm install
npm run dev
```

Open **http://localhost:3456**

## Flow

1. **Setup** — firm preset, size, phase  
2. **Connect** — cTrader demo / MT5 manual / skip  
3. **Rules** — challenge walls + Midfleet governance gates  
4. **Desk** — chat chips + Midfleet mock engine + trade ingest  
5. **Ticket** — human confirm, win/loss/planned log  
6. **Journal** — compliance recalculated  

## Notes

- No auth, no real broker, no live orders.
- Midfleet is simulated in `src/lib/midfleet.ts` (same contract shape as a real workflow later).
- Styling matches Trading OS dark cockpit brand.
