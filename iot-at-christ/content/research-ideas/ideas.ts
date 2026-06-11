import type { ResearchIdea } from '@/types/research-ideas'

/**
 * Research Idea Bank — curated, research-grade IoT project directions
 * for M.Tech CSE (IoT) students. Hand-written; no paper citations by
 * design (anti-hallucination rule: venue names only, all real venues).
 */
export const RESEARCH_IDEAS: ResearchIdea[] = [
  // ───────────────────────────── Healthcare ─────────────────────────────
  {
    id: 'tinyml-ecg-arrhythmia-wearable',
    title: 'TinyML On-Wrist Arrhythmia Screening',
    domain: 'healthcare',
    difficulty: 'intermediate',
    summary:
      'Run a quantised arrhythmia classifier directly on an ESP32 wearable so irregular heart rhythms are flagged without streaming raw ECG to the cloud. The challenge is squeezing clinically useful accuracy into a few hundred kilobytes of RAM.',
    realWorldValue:
      'Cardiac screening camps in semi-urban Karnataka often lack cardiologists; an affordable wearable that pre-screens for atrial fibrillation lets scarce specialists focus on flagged patients.',
    researchAngle:
      'How much accuracy survives aggressive quantisation and pruning on a single-lead, motion-corrupted ECG — and can on-device personalisation close the gap without retraining in the cloud?',
    hardware: ['ESP32-S3', 'Li-Po power module'],
    sensors: ['AD8232 ECG front-end', 'MAX30102 pulse oximeter', 'MPU-6050 accelerometer'],
    paperKeywords: ['TinyML', 'wearable sensors', 'ECG classification', 'edge computing', 'model quantisation'],
    suggestedVenues: ['IEEE Journal of Biomedical and Health Informatics', 'IEEE Internet of Things Journal', 'IEEE Sensors Journal'],
    simulatorFriendly: true,
  },
  {
    id: 'ambient-assisted-living-radar',
    title: 'Camera-Free Ambient Assisted Living for Elders',
    domain: 'healthcare',
    difficulty: 'intermediate',
    summary:
      'Detect falls and worrying routine changes in an elder’s home using mmWave radar and PIR sensors instead of cameras, preserving dignity and privacy. Events are inferred at the edge and only alerts leave the house.',
    realWorldValue:
      'India’s nuclear families increasingly leave elders living alone; a privacy-first monitor that family members actually accept could meaningfully cut the time-to-help after a fall.',
    researchAngle:
      'Can radar point-cloud features distinguish falls from sitting-down or dropped objects reliably across cluttered Indian homes, and what fusion with PIR/door sensors minimises false alarms?',
    hardware: ['Raspberry Pi 4', 'ESP32', 'TI IWR6843 mmWave module'],
    sensors: ['mmWave radar', 'PIR motion sensor', 'magnetic door contact', 'BME280 environment sensor'],
    paperKeywords: ['ambient assisted living', 'fall detection', 'mmWave radar', 'privacy-preserving sensing', 'sensor fusion'],
    suggestedVenues: ['ACM Transactions on Internet of Things', 'IEEE Internet of Things Journal', 'ACM UbiComp / IMWUT'],
    simulatorFriendly: true,
  },
  {
    id: 'federated-vitals-anomaly',
    title: 'Federated Learning over Hospital Vitals Monitors',
    domain: 'healthcare',
    difficulty: 'advanced',
    summary:
      'Train an anomaly detector for patient vitals across multiple wards or hospitals without raw data ever leaving each gateway, using federated averaging on edge devices. Tackles the core tension between model quality and patient privacy.',
    realWorldValue:
      'Indian hospitals cannot legally or ethically pool patient telemetry; federated training lets small hospitals benefit from collective models while complying with the DPDP Act.',
    researchAngle:
      'How do non-IID vitals distributions across wards degrade federated convergence, and which lightweight personalisation layers recover per-ward accuracy on Raspberry-Pi-class aggregators?',
    hardware: ['Raspberry Pi 4 (ward gateway)', 'ESP32 bedside nodes'],
    sensors: ['MAX30102 pulse oximeter', 'temperature probe', 'respiration belt sensor'],
    paperKeywords: ['federated learning', 'healthcare IoT', 'anomaly detection', 'non-IID data', 'edge intelligence'],
    suggestedVenues: ['IEEE Internet of Things Journal', 'IEEE Transactions on Mobile Computing', 'ACM SenSys'],
    simulatorFriendly: false,
  },
  {
    id: 'vaccine-cold-chain-lorawan',
    title: 'LoRaWAN Cold-Chain Integrity for Rural Vaccine Delivery',
    domain: 'healthcare',
    difficulty: 'beginner',
    summary:
      'Instrument vaccine carriers and PHC fridges with temperature loggers that report over LoRaWAN, building a tamper-evident cold-chain record from district store to village clinic. Simple sensing, interesting systems questions.',
    realWorldValue:
      'Vaccine potency losses from cold-chain breaks are a documented problem in last-mile Indian health logistics; district health officers get live visibility instead of paper logs.',
    researchAngle:
      'What duty-cycling and store-and-forward strategy keeps a coin-cell logger alive for a full immunisation season while still proving, cryptographically, that no excursion was deleted?',
    hardware: ['ESP32', 'LoRa SX1278', 'RAK7268 LoRaWAN gateway'],
    sensors: ['DS18B20 temperature probe', 'SHT31 humidity sensor', 'reed switch (lid open)'],
    paperKeywords: ['LoRaWAN', 'cold chain monitoring', 'low-power WAN', 'data integrity', 'rural health logistics'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Access', 'ACM COMPASS'],
    simulatorFriendly: true,
  },

  // ───────────────────────────── Agriculture ────────────────────────────
  {
    id: 'precision-irrigation-smallholder',
    title: 'Evapotranspiration-Aware Irrigation for Smallholders',
    domain: 'agriculture',
    difficulty: 'beginner',
    summary:
      'Combine soil-moisture probes with local weather sensing to schedule drip irrigation by crop water demand rather than fixed timers. The node advises (or actuates) when and how much to irrigate.',
    realWorldValue:
      'Borewell-dependent farmers in dry Karnataka districts like Kolar over-irrigate by habit; demand-driven scheduling saves both water and the electricity bill that comes with pumping it.',
    researchAngle:
      'How closely can a ₹2,000 sensor node approximate reference evapotranspiration models, and does closed-loop control measurably out-perform farmer intuition over a full crop cycle?',
    hardware: ['ESP32', 'LoRa SX1278', 'solenoid valve driver', 'solar charge module'],
    sensors: ['capacitive soil moisture probe', 'DHT22', 'BH1750 light sensor', 'rain gauge'],
    paperKeywords: ['precision agriculture', 'smart irrigation', 'evapotranspiration', 'wireless sensor networks', 'water conservation'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Access', 'ACM COMPASS'],
    simulatorFriendly: true,
  },
  {
    id: 'tinyml-pest-disease-camera',
    title: 'Solar Edge Cameras for Early Pest and Disease Alerts',
    domain: 'agriculture',
    difficulty: 'intermediate',
    summary:
      'Deploy solar-powered camera nodes in fields that run a TinyML classifier for visible pest damage or fungal disease on-device, sending only alerts over LoRa. Avoids both cloud costs and rural bandwidth limits.',
    realWorldValue:
      'Early blight or leaf-miner detection even two days sooner changes spray decisions for tomato and ragi growers, cutting pesticide cost and crop loss for Karnataka smallholders.',
    researchAngle:
      'Which model architectures hold up under field lighting, dust, and seasonal leaf variation when compressed to microcontroller scale — and how should the node decide an image is worth escalating?',
    hardware: ['ESP32-CAM', 'LoRa SX1278', 'solar panel + TP4056 charger'],
    sensors: ['OV2640 camera', 'soil moisture probe', 'DHT22'],
    paperKeywords: ['TinyML', 'precision agriculture', 'plant disease detection', 'edge AI', 'LoRa'],
    suggestedVenues: ['IEEE Internet of Things Journal', 'Computers and Electronics in Agriculture', 'IEEE Access'],
    simulatorFriendly: false,
  },
  {
    id: 'cattle-health-collar',
    title: 'Behaviour-Sensing Collars for Dairy Cattle Health',
    domain: 'agriculture',
    difficulty: 'intermediate',
    summary:
      'An accelerometer collar classifies rumination, grazing, and resting patterns to flag illness or oestrus early, relaying summaries over BLE-to-LoRa gateways. Animal behaviour is the sensor.',
    realWorldValue:
      'For India’s dairy cooperatives, catching mastitis or missed heat cycles a day earlier directly affects a smallholder family’s milk income; vets can triage herds remotely.',
    researchAngle:
      'Can on-collar activity classification generalise across breeds and free-grazing (not just barn) conditions, and what alerting threshold balances vet workload against missed events?',
    hardware: ['ESP32', 'nRF52840', 'LoRa SX1278 gateway node'],
    sensors: ['MPU-6050 accelerometer/gyro', 'DS18B20 skin temperature', 'GPS module'],
    paperKeywords: ['livestock monitoring', 'activity recognition', 'wearable sensors', 'BLE', 'smart dairy'],
    suggestedVenues: ['IEEE Sensors Journal', 'Computers and Electronics in Agriculture', 'ACM SenSys'],
    simulatorFriendly: true,
  },
  {
    id: 'energy-harvesting-soil-nodes',
    title: 'Batteryless Soil Sensing via Energy Harvesting',
    domain: 'agriculture',
    difficulty: 'advanced',
    summary:
      'Design soil-sensor nodes that live entirely off harvested energy — small solar cells or soil microbial fuel cells — using intermittent computing to survive power loss mid-task. The battery, not the sensor, is what dies first in field deployments.',
    realWorldValue:
      'Battery replacement is the hidden cost that kills agri-IoT pilots across rural India; a deploy-and-forget node changes the economics of long-term soil monitoring.',
    researchAngle:
      'How should sensing, computation, and LoRa transmission be scheduled under a stochastic energy budget, and can checkpointing make intermittent nodes provide usable data continuity?',
    hardware: ['MSP430 / ESP32 with BQ25570 harvester', 'LoRa SX1278', 'supercapacitor storage'],
    sensors: ['capacitive soil moisture probe', 'soil temperature probe', 'soil NPK sensor'],
    paperKeywords: ['energy harvesting', 'intermittent computing', 'batteryless IoT', 'precision agriculture', 'low-power design'],
    suggestedVenues: ['ACM SenSys', 'IEEE Transactions on Green Communications and Networking', 'ACM/IEEE IPSN'],
    simulatorFriendly: false,
  },

  // ───────────────────────────── Smart City ─────────────────────────────
  {
    id: 'acoustic-traffic-density-bengaluru',
    title: 'Acoustic Traffic Sensing for Adaptive Signals',
    domain: 'smart-city',
    difficulty: 'intermediate',
    summary:
      'Estimate junction-level traffic density and honking stress from roadside microphones with on-device audio ML, feeding adaptive signal timing — no cameras, no number plates, no privacy fight. Cheap enough to blanket a corridor.',
    realWorldValue:
      'Bengaluru’s signalised junctions mostly run fixed timings; a ₹3,000 acoustic node per arm offers BBMP/traffic police a low-cost densification layer where camera analytics are too expensive.',
    researchAngle:
      'How well do acoustic features track vehicle counts across Indian traffic’s unique mix (two-wheelers, autos, honking culture), and can a network of noisy estimators still drive stable signal control?',
    hardware: ['ESP32-S3', 'Raspberry Pi 4 (junction aggregator)'],
    sensors: ['I2S MEMS microphone', 'PM2.5 sensor (co-located air quality)'],
    paperKeywords: ['intelligent transportation systems', 'acoustic sensing', 'edge AI', 'adaptive traffic control', 'smart city'],
    suggestedVenues: ['IEEE Transactions on Intelligent Transportation Systems', 'IEEE Internet of Things Journal', 'ACM/IEEE IoTDI'],
    simulatorFriendly: true,
  },
  {
    id: 'water-network-leak-transients',
    title: 'Pressure-Transient Leak Localisation in Intermittent Water Supply',
    domain: 'smart-city',
    difficulty: 'advanced',
    summary:
      'Place pressure loggers across a water distribution zone and use the pressure transients created by intermittent supply cycles themselves to detect and localise leaks. Indian supply patterns become the test signal.',
    realWorldValue:
      'Indian utilities lose a large share of treated water to leaks, and most cities supply water intermittently; leak localisation tuned to that reality helps BWSSB-style utilities prioritise repairs.',
    researchAngle:
      'Classical transient analysis assumes continuous pressurised networks — what changes when daily fill-and-drain cycles dominate, and how sparse can the sensor placement be while still localising?',
    hardware: ['ESP32', 'LoRa SX1278', 'NB-IoT module (SIM7020)'],
    sensors: ['piezoresistive pressure transducer', 'ultrasonic flow sensor'],
    paperKeywords: ['water distribution networks', 'leak detection', 'pressure transients', 'smart water grid', 'sparse sensing'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Internet of Things Journal', 'ACM/IEEE ICCPS'],
    simulatorFriendly: true,
  },
  {
    id: 'low-cost-aq-network-calibration',
    title: 'Self-Calibrating Low-Cost Air Quality Networks',
    domain: 'smart-city',
    difficulty: 'beginner',
    summary:
      'Build a dense network of low-cost PM and gas sensors and study how to keep them honest: drift correction, cross-sensor calibration, and transfer of calibration from the few reference-grade stations a city has.',
    realWorldValue:
      'Bengaluru has only a handful of regulatory monitors for 1.4 crore people; trustworthy hyperlocal AQI lets schools and hospitals make ventilation and outdoor-activity decisions street by street.',
    researchAngle:
      'How long does a co-location calibration survive Indian conditions (humidity spikes, festival fireworks, construction dust), and can network-wide consistency checks detect a drifting node automatically?',
    hardware: ['ESP32', 'Raspberry Pi 4 (reference co-location node)'],
    sensors: ['PMS5003 particulate sensor', 'MQ-135 gas sensor', 'SHT31 humidity sensor', 'BME280'],
    paperKeywords: ['air quality monitoring', 'low-cost sensors', 'sensor calibration', 'drift compensation', 'urban sensing'],
    suggestedVenues: ['IEEE Sensors Journal', 'ACM Transactions on Internet of Things', 'IEEE Access'],
    simulatorFriendly: true,
  },
  {
    id: 'digital-twin-bus-fleet',
    title: 'Digital Twin of a City Bus Corridor',
    domain: 'smart-city',
    difficulty: 'advanced',
    summary:
      'Fuse GPS, door, and occupancy sensing from buses into a live digital twin of one corridor, then use it to predict and counteract bus bunching. The twin is the experiment platform: test interventions virtually before the street.',
    realWorldValue:
      'BMTC-style operators fight bunching daily with manual dispatch; a corridor twin that recommends holding times could improve headway regularity without buying a single new bus.',
    researchAngle:
      'What minimum sensing fidelity (GPS rate, occupancy accuracy) does a useful transit twin actually need, and how do model-predicted holding strategies survive real driver and traffic noise?',
    hardware: ['Raspberry Pi 4 (on-bus unit)', 'ESP32', 'GPS NEO-6M', '4G module'],
    sensors: ['GPS', 'ultrasonic door counters', 'BLE passenger-presence scanner'],
    paperKeywords: ['digital twin', 'public transit', 'bus bunching', 'cyber-physical systems', 'predictive control'],
    suggestedVenues: ['IEEE Transactions on Intelligent Transportation Systems', 'ACM/IEEE ICCPS', 'IEEE Internet of Things Journal'],
    simulatorFriendly: false,
  },

  // ────────────────────────────── Defence ───────────────────────────────
  {
    id: 'uwa-modem-doppler-shallow',
    title: 'Doppler-Resilient Modulation for Shallow-Water Acoustic Modems',
    domain: 'defence',
    difficulty: 'advanced',
    summary:
      'Design and bench-test modulation schemes (chirp and OFDM variants) for low-cost underwater acoustic modems that tolerate the severe Doppler and multipath of shallow coastal water. Software-defined: the same transducer pair, smarter waveforms.',
    realWorldValue:
      'Affordable acoustic modems unlock harbour security, fishing-zone telemetry, and naval sensor pickets along India’s 7,500 km coastline, where imported modems are prohibitively expensive.',
    researchAngle:
      'Which waveform family gives the best bit-rate-versus-robustness trade-off in warm, shallow, high-traffic Indian coastal water — a channel measurably harsher than the deep-water assumptions in most modem designs?',
    hardware: ['Teensy 4.1 / STM32 DSP board', 'Raspberry Pi 4', 'class-D power amplifier', 'piezo transducer pair'],
    sensors: ['hydrophone', 'piezoelectric transducer', 'water temperature probe'],
    paperKeywords: ['underwater acoustic communication', 'Doppler compensation', 'OFDM', 'software-defined modem', 'shallow water channel'],
    suggestedVenues: ['IEEE Journal of Oceanic Engineering', 'ACM WUWNet', 'IEEE OCEANS Conference'],
    simulatorFriendly: false,
  },
  {
    id: 'uwa-network-mac-harbour',
    title: 'Delay-Tolerant MAC for Underwater Harbour Surveillance Networks',
    domain: 'defence',
    difficulty: 'advanced',
    summary:
      'Underwater acoustic networks face five orders of magnitude more propagation delay than radio; design and simulate a MAC/scheduling protocol for a small grid of seabed sensors guarding a harbour approach. Protocol work first, tank tests second.',
    realWorldValue:
      'Persistent underwater surveillance of harbour approaches is a stated need for Indian port and naval security; energy-efficient networking is what makes month-long seabed deployments feasible.',
    researchAngle:
      'Can propagation delay be exploited rather than fought — scheduling transmissions so they interleave in space-time — and how does that compare to ALOHA-style baselines on energy per delivered alert?',
    hardware: ['ESP32 (topside emulation)', 'Raspberry Pi 4 (network simulator host)', 'piezo transducer pair (tank tests)'],
    sensors: ['hydrophone', 'magnetometer', 'passive acoustic event detector'],
    paperKeywords: ['underwater acoustic networks', 'medium access control', 'propagation delay', 'energy efficiency', 'maritime surveillance'],
    suggestedVenues: ['IEEE Journal of Oceanic Engineering', 'ACM WUWNet', 'Ad Hoc Networks (Elsevier)'],
    simulatorFriendly: false,
  },
  {
    id: 'uav-lora-mesh-relay',
    title: 'UAV-Borne LoRa Mesh for Disconnected-Area Communications',
    domain: 'defence',
    difficulty: 'advanced',
    summary:
      'Mount LoRa mesh relays on small UAVs to stitch together ground sensor fields or troops in terrain with no infrastructure — mountains, forests, disaster zones. The research is in placement and persistence, not just flying.',
    realWorldValue:
      'Border posts and disaster-response teams in the Himalayas and Northeast routinely operate beyond cellular coverage; a two-drone relay can restore situational reporting within minutes.',
    researchAngle:
      'Given limited flight time, where should relays loiter to maximise sensor-field coverage — and can the mesh re-plan autonomously when a UAV departs to recharge?',
    hardware: ['ESP32', 'LoRa SX1276', 'Pixhawk-class flight controller', 'Raspberry Pi Zero 2 W'],
    sensors: ['GPS', 'barometric altimeter', 'RSSI link-quality probes'],
    paperKeywords: ['UAV networks', 'LoRa mesh', 'relay placement', 'disaster communications', 'delay-tolerant networking'],
    suggestedVenues: ['IEEE Internet of Things Journal', 'IEEE Transactions on Vehicular Technology', 'Ad Hoc Networks (Elsevier)'],
    simulatorFriendly: false,
  },
  {
    id: 'perimeter-intrusion-sensor-fusion',
    title: 'Low-False-Alarm Perimeter Intrusion Detection by Sensor Fusion',
    domain: 'defence',
    difficulty: 'intermediate',
    summary:
      'Fuse buried geophones, PIR, and fence-mounted vibration sensors with a TinyML classifier to tell intruders from cattle, wind, and rain. The hard problem is not detection — it is the false alarm rate that makes operators ignore systems.',
    realWorldValue:
      'Installations from defence depots to solar farms in rural India suffer alarm fatigue from animal triggers; a fused classifier that halves false alarms makes the human response loop credible again.',
    researchAngle:
      'What is the minimal sensor combination and on-node feature set that achieves operationally acceptable false-alarm rates across monsoon and dry-season conditions?',
    hardware: ['ESP32', 'LoRa SX1278', 'solar power module'],
    sensors: ['geophone', 'PIR motion sensor', 'SW-420 vibration sensor', 'microphone'],
    paperKeywords: ['intrusion detection', 'sensor fusion', 'TinyML', 'false alarm reduction', 'perimeter security'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Internet of Things Journal', 'IEEE Access'],
    simulatorFriendly: true,
  },

  // ───────────────────────────── Environment ────────────────────────────
  {
    id: 'forest-fire-lora-mesh',
    title: 'Energy-Aware LoRa Mesh for Forest Fire Early Warning',
    domain: 'environment',
    difficulty: 'intermediate',
    summary:
      'A mesh of gas, temperature, and humidity nodes under the canopy detects fire signatures minutes after ignition, well before satellite hotspots appear. Nodes must route around failed (burnt) neighbours and survive years on harvested energy.',
    realWorldValue:
      'Forest departments in the Western Ghats and Bandipur currently rely on watchtowers and satellite passes; ground-truth detection at ignition scale changes how fast crews can respond.',
    researchAngle:
      'How should the mesh trade detection latency against node lifetime, and can a network self-localise a fire front from the order in which nodes fall silent?',
    hardware: ['ESP32', 'LoRa SX1278', 'solar panel + supercapacitor'],
    sensors: ['MQ-2 smoke/gas sensor', 'SHT31 temperature-humidity', 'IR flame sensor'],
    paperKeywords: ['forest fire detection', 'wireless sensor networks', 'LoRa mesh', 'energy efficiency', 'environmental monitoring'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Internet of Things Journal', 'Ad Hoc Networks (Elsevier)'],
    simulatorFriendly: true,
  },
  {
    id: 'urban-lake-buoy-monitoring',
    title: 'Sensor Buoys for Urban Lake Health',
    domain: 'environment',
    difficulty: 'beginner',
    summary:
      'Floating sensor buoys log dissolved oxygen, pH, turbidity, and conductivity in a polluted urban lake and stream it to a public dashboard. Aim: catch sewage inflow events as they happen, not weeks later in a lab report.',
    realWorldValue:
      'Bengaluru’s lakes — from Bellandur’s froth to fish-kill events elsewhere — are monitored by sparse manual sampling; continuous data gives citizen groups and the lake authority actionable evidence.',
    researchAngle:
      'Can low-cost probes, with periodic cross-calibration, detect pollution inflow events reliably despite biofouling — and what cleaning/calibration cadence keeps data defensible?',
    hardware: ['ESP32', 'LoRa SX1278', 'solar buoy power system'],
    sensors: ['dissolved oxygen probe', 'analog pH probe', 'turbidity sensor', 'EC/TDS probe', 'DS18B20'],
    paperKeywords: ['water quality monitoring', 'environmental IoT', 'sensor buoys', 'biofouling', 'low-cost sensing'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Access', 'ACM COMPASS'],
    simulatorFriendly: true,
  },
  {
    id: 'landslide-early-warning-ghats',
    title: 'Slope-Instability Early Warning for Monsoon Landslides',
    domain: 'environment',
    difficulty: 'advanced',
    summary:
      'Instrument a vulnerable slope with pore-pressure, tilt, and soil-moisture sensors to detect the precursors of rainfall-triggered landslides and issue graded warnings. The science is in separating precursor signals from monsoon noise.',
    realWorldValue:
      'Western Ghats districts in Karnataka and Kerala see fatal monsoon landslides almost yearly; even a 30-minute validated warning for a specific slope can clear a village road or settlement.',
    researchAngle:
      'Which combination of cheap proxies (tilt rate, moisture front velocity) best approximates expensive piezometer-based thresholds, and how should a warning system express uncertainty to authorities?',
    hardware: ['ESP32', 'LoRa SX1278', 'NB-IoT fallback module', 'solar power module'],
    sensors: ['MPU-6050 tilt/IMU', 'capacitive soil moisture probes (multi-depth)', 'pore pressure transducer', 'rain gauge'],
    paperKeywords: ['landslide early warning', 'geohazard monitoring', 'wireless sensor networks', 'threshold modelling', 'environmental sensing'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Internet of Things Journal', 'Sensors (MDPI)'],
    simulatorFriendly: true,
  },

  // ───────────────────────────── Industrial ─────────────────────────────
  {
    id: 'shm-railway-bridge-vibration',
    title: 'Vibration-Based Structural Health Monitoring of Railway Bridges',
    domain: 'industrial',
    difficulty: 'advanced',
    summary:
      'Attach synchronised accelerometer nodes to a bridge and extract modal features at the edge, transmitting only spectral summaries; shifts in natural frequencies and mode shapes flag deterioration. Every passing train is a free excitation test.',
    realWorldValue:
      'Indian Railways maintains tens of thousands of ageing bridges with periodic visual inspection; continuous modal monitoring lets engineers rank which bridges actually need a closer look.',
    researchAngle:
      'How precisely must low-cost MEMS nodes be time-synchronised for usable mode shapes, and can train-induced (rather than ambient) excitation be exploited despite its non-stationarity?',
    hardware: ['ESP32', 'Raspberry Pi 4 (edge aggregator)', 'LoRa SX1278', 'GPS module (time sync)'],
    sensors: ['ADXL355 MEMS accelerometer', 'strain gauge', 'temperature probe'],
    paperKeywords: ['structural health monitoring', 'modal analysis', 'MEMS accelerometers', 'time synchronisation', 'edge computing'],
    suggestedVenues: ['IEEE Sensors Journal', 'ACM/IEEE IPSN', 'IEEE Internet of Things Journal'],
    simulatorFriendly: true,
  },
  {
    id: 'predictive-maintenance-induction-motors',
    title: 'TinyML Predictive Maintenance for Induction Motors',
    domain: 'industrial',
    difficulty: 'intermediate',
    summary:
      'Clamp a vibration-and-current sensing node onto workshop induction motors and run bearing-fault and imbalance classifiers on-device, raising maintenance tickets before failure. A classic problem, newly cheap to solve at the edge.',
    realWorldValue:
      'MSME workshops around Peenya and Bommasandra cannot afford commercial condition-monitoring suites; a sub-₹5,000 retrofit node brings predictive maintenance to India’s small-factory backbone.',
    researchAngle:
      'Do models trained on one motor transfer to others of the same class without per-machine labelling, and can current-signature analysis alone match accelerometer-based accuracy?',
    hardware: ['ESP32-S3', 'SCT-013 current clamp interface'],
    sensors: ['ADXL345 accelerometer', 'SCT-013 current transformer', 'IR temperature sensor', 'microphone'],
    paperKeywords: ['predictive maintenance', 'TinyML', 'motor current signature analysis', 'vibration analysis', 'Industry 4.0'],
    suggestedVenues: ['IEEE Transactions on Industrial Informatics', 'IEEE Sensors Journal', 'IEEE Access'],
    simulatorFriendly: true,
  },
  {
    id: 'confined-space-worker-safety',
    title: 'Wearable Gas and Vitals Safety Net for Confined-Space Workers',
    domain: 'industrial',
    difficulty: 'beginner',
    summary:
      'A belt-worn node tracks toxic gases, oxygen depletion, and worker immobility inside tanks, manholes, and sewers, alerting a surface supervisor over a through-structure radio link. Connectivity inside metal and underground spaces is the twist.',
    realWorldValue:
      'Deaths of sanitation and tank-cleaning workers from gas exposure remain a recurring tragedy in Indian cities; a reliable pre-alarm plus man-down detection directly protects the most vulnerable workers.',
    researchAngle:
      'Which sub-GHz link strategies actually penetrate manhole and tank geometries, and how should immobility detection avoid false alarms during legitimate crouched work?',
    hardware: ['ESP32', 'LoRa SX1278 (433 MHz)', 'vibration motor (haptic alert)'],
    sensors: ['MQ-7 CO sensor', 'MQ-136 H2S sensor', 'electrochemical O2 sensor', 'MPU-6050 accelerometer'],
    paperKeywords: ['occupational safety', 'wearable IoT', 'gas sensing', 'sub-GHz communication', 'man-down detection'],
    suggestedVenues: ['IEEE Sensors Journal', 'IEEE Internet of Things Journal', 'IEEE Access'],
    simulatorFriendly: true,
  },
  {
    id: 'cnc-digital-twin-energy',
    title: 'Lightweight Digital Twins for Machine-Shop Energy Optimisation',
    domain: 'industrial',
    difficulty: 'intermediate',
    summary:
      'Build per-machine digital twins from non-invasive power and vibration sensing in a small machine shop, then use the twin ensemble to find idle-energy waste and schedule jobs against time-of-day tariffs. Twin techniques scaled down to MSME budgets.',
    realWorldValue:
      'Energy is a top-three cost for small Indian fabrication shops; even identifying machines idling at full spindle readiness typically reveals double-digit-percentage savings.',
    researchAngle:
      'How simple can a state-estimation twin be (states from power signatures alone?) while still predicting per-job energy well enough to drive scheduling decisions?',
    hardware: ['ESP32', 'Raspberry Pi 4 (shop-floor server)', 'PZEM-004T power meter module'],
    sensors: ['SCT-013 current transformer', 'voltage sensing module', 'ADXL345 accelerometer'],
    paperKeywords: ['digital twin', 'energy disaggregation', 'smart manufacturing', 'non-intrusive load monitoring', 'Industry 4.0'],
    suggestedVenues: ['IEEE Transactions on Industrial Informatics', 'ACM/IEEE IoTDI', 'IEEE Access'],
    simulatorFriendly: true,
  },
]
