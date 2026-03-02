export class ZoneManager {
    constructor() {
        this.zones = [];
    }

    loadZones(visionData) {
        if (visionData && visionData.zones) {
            this.zones = visionData.zones.map(z => ({ ...z, active: true }));
        }
    }

    getZones() {
        return this.zones.filter(z => z.active);
    }

    expireZone(index) {
        if(this.zones[index]) {
            this.zones[index].active = false;
        }
    }
}

export class SMCLogic {
    constructor() {
        this.state = {
            htfBias: null, // 'bullish', 'bearish'
            ltfShift: null, // 'bullish', 'bearish'
            sweepDetected: false,
            sniperReady: false
        };
    }

    processCandle(candle, zoneManager, onAlert) {
        const zones = zoneManager.getZones();

        // Very simplified SMC Engine Logic for demonstration
        // We will mock states based on simple price movement

        let inZone = false;
        for(let i=0; i<zones.length; i++) {
            const z = zones[i];
            if (candle.close >= z.low && candle.close <= z.high) {
                inZone = true;
                // mock: Price entered a zone

                // 1. HTF bias
                if (this.state.htfBias === 'bullish') {
                    // 3. Sweep detected inside zone
                    if (candle.low < z.low + (z.high - z.low) * 0.2) { // arbitrary sweep logic
                        this.state.sweepDetected = true;
                    }

                    // 4. LTF CHoCH
                    if (this.state.sweepDetected && candle.close > candle.open) { // mock LTF shift
                         this.state.ltfShift = 'bullish';
                    }

                    // 7. Sniper Entry Model ready
                    if (this.state.sweepDetected && this.state.ltfShift === 'bullish') {
                         this.state.sniperReady = true;
                         onAlert({
                             type: 'SNIPER SETUP READY',
                             direction: 'LONG',
                             price: candle.close,
                             timestamp: candle.timestamp
                         });

                         // Expiry zone
                         zoneManager.expireZone(i);
                         this.resetState();
                         break;
                    }
                }
            }
        }
    }

    setHtfBias(bias) {
        this.state.htfBias = bias;
    }

    resetState() {
        this.state.sweepDetected = false;
        this.state.ltfShift = null;
        this.state.sniperReady = false;
    }
}

export class Engine {
    constructor() {
        this.zoneManager = new ZoneManager();
        this.smcLogic = new SMCLogic();
        // default mock bias for testing
        this.smcLogic.setHtfBias('bullish');
    }

    importVisionData(data) {
        this.zoneManager.loadZones(data);
    }

    tick(candle, onAlert) {
        this.smcLogic.processCandle(candle, this.zoneManager, onAlert);
    }

    getState() {
        return {
            zones: this.zoneManager.getZones(),
            logicState: this.smcLogic.state
        };
    }
}
