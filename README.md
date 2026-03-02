# SMC-sniper-
Build a full-stack web application called SMC Sniper.

The website is a hybrid system:
	1.	a screenshot importer that extracts marked SMC objects from chart screenshots
	2.	a real-time SMC engine that runs on live price data and produces sniper-entry alerts.

This system is NOT allowed to scrape any trading platform.
All live logic must run only on raw OHLC data coming from a broker or market-data feed.

⸻

1. Core purpose

The website must allow a trader to:

• upload a chart screenshot that already contains
– swing highs / swing lows (only if visually marked)
– BOS labels
– CHoCH labels
– displacement candles (optional)
– demand zones (blue rectangles)

Then the system must:

• extract the objects from the image
• convert them into structured data
• import only the zones and visual context
• and run a live SMC engine that waits for sniper entries on real price data.

Screenshot data must never be used to trigger trades directly.

⸻

2. Architecture (mandatory)

Use a hybrid backend:

Frontend
– simple web UI
– screenshot upload
– chart viewer
– live status of imported zones
– sniper setup / trigger log

Backend API (Node.js)
– handles uploads
– stores extracted setup objects
– serves the live engine

Vision service (Python)
– processes screenshots
– detects rectangles, labels and scale
– returns structured JSON

Live engine (Node.js module)
– connects to real-time candle feed
– runs SMC logic
– triggers alerts

⸻

3. Screenshot importer requirements

From the uploaded screenshot, detect:

A. Demand zones
– blue or semi-transparent rectangles
– return rectangle vertical boundaries
– convert them to price using the price axis

B. Text labels
– detect and OCR only these keywords:
BOS, CHoCH, EQH, EQL, Weak High, Strong Low

C. Swing markers
– only if visually marked on the chart

D. Price scale extraction
– OCR the right price axis
– build a linear mapping from pixel-Y to price

Output JSON format:

{
zones: [{ low, high }],
labels: [{ type, price }],
swings: [{ type, price }]
}

Only zones are mandatory for live trading.

⸻

4. Mandatory design rule

BOS, CHoCH, swings and displacement coming from the screenshot are informational only.

They must be stored for display and debugging, but must NOT drive execution.

All execution logic must come from the live SMC engine.

⸻

5. Live SMC engine requirements

The engine must operate on real OHLC candles and must implement:

• internal swing detection
• BOS detection
• CHoCH detection
• displacement filter
• structure trend state
• micro-structure for LTF

⸻

6. Imported zone manager

The live engine must:

• load zones created by the screenshot importer
• monitor price interaction with each zone
• automatically expire a zone when:
– it is cleanly mitigated, or
– a higher-timeframe CHoCH forms against it

⸻

7. Sniper entry model

The engine must wait for the following sequence:
	1.	Higher-timeframe structure is bullish or bearish
	2.	Price enters an imported zone
	3.	A liquidity sweep occurs inside the zone
	4.	A lower-timeframe CHoCH appears in the direction of the higher-timeframe bias
	5.	The first pullback after the shift occurs

Only then produce:

SNIPER SETUP READY

The system must not market-enter on the break.

⸻

8. Alert system

Support:

• on-screen alerts
• webhook output (for Telegram / Discord / bots)
• log history of setups and triggers

⸻

9. UI requirements

The website must show:

• imported zones
• detected labels from screenshot
• live candles
• live structure state
• current zone interaction
• sweep detected
• LTF shift detected
• sniper ready

The UI is informational only.
All logic must live on the backend.

⸻

10. Development constraints

• Do not scrape TradingView or any platform
• Do not reverse engineer private APIs
• Use a real broker feed or market-data provider
• Vision and trading logic must be strictly separated
• The system must continue running after screenshot import without any further screenshots

⸻

11. Folder structure expectation

frontend/
api/
vision/
engine/

⸻

12. Non-functional requirements

• modular code
• clear interfaces between:
– vision output
– zone manager
– structure engine
– entry engine
• easy replacement of data feed module
• easy back-testing later

⸻

The final system must behave like a professional trading assistant:

The screenshot is only used to import human-marked context (especially zones).
All market structure and execution logic must be computed live and independently.
