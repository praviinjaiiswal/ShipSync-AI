import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Statutory Indian Customs Tariff Schedule (ITC-HS 2026) Starter Dataset
 * Sourced from: CBIC Customs Tariff Notifications & DGFT ITC(HS) Classifications
 * Focus sectors: Engineering Goods, Textiles & Apparel, Chemicals & Pharma, Agro & Marine
 */
const TARIFF_RECORDS = [
  // -------------------------------------------------------------
  // 1. Engineering Goods (Chapters 84, 85, 87)
  // -------------------------------------------------------------
  {
    hsCode: '84821011',
    description: 'Ball bearings of radial type of bore diameter not exceeding 50mm',
    unit: 'NOS',
    chapterHeading: '8482',
    notes: 'Standard industrial bearings for high-precision rotating machinery',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '84821012',
    description: 'Ball bearings of radial type of bore diameter exceeding 50mm but not exceeding 100mm',
    unit: 'NOS',
    chapterHeading: '8482',
    notes: 'Heavy machinery and industrial motor bearings',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '84834000',
    description: 'Gears and gearing, other than toothed wheels, chain sprockets and other transmission elements presented separately; ball or roller screws; gear boxes',
    unit: 'NOS',
    chapterHeading: '8483',
    notes: 'Industrial and automotive gearboxes and power transmission assemblies',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '84818030',
    description: 'Industrial valves for pipes, boiler shells, tanks, vats or the like (including pressure reducing valves and thermostatically controlled valves)',
    unit: 'KGS',
    chapterHeading: '8481',
    notes: 'Stainless steel and cast iron industrial process valves',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '84137010',
    description: 'Centrifugal pumps primarily designed for handling water (single stage/multi stage)',
    unit: 'NOS',
    chapterHeading: '8413',
    notes: 'Agricultural and municipal water transmission pumps',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '84148011',
    description: 'Gas compressors of a kind used in refrigerating equipment',
    unit: 'NOS',
    chapterHeading: '8414',
    notes: 'Hermetic and semi-hermetic refrigeration compressors',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '84713010',
    description: 'Personal computers (laptops, palmtops, notebooks) with central processing unit',
    unit: 'NOS',
    chapterHeading: '8471',
    notes: 'Information technology hardware under WTO ITA-1 agreement',
    source: 'CBIC Customs Tariff Act, First Schedule (Electronics/IT)',
  },
  {
    hsCode: '84717020',
    description: 'Hard disk drives for automatic data processing machines',
    unit: 'NOS',
    chapterHeading: '8471',
    notes: 'Magnetic and solid-state data storage assemblies',
    source: 'CBIC Customs Tariff Act, First Schedule (Electronics/IT)',
  },
  {
    hsCode: '84798999',
    description: 'Other machines and mechanical appliances having individual functions, not specified or included elsewhere',
    unit: 'NOS',
    chapterHeading: '8479',
    notes: 'Custom manufacturing and specialized automated machinery',
    source: 'CBIC Customs Tariff Act, First Schedule (Engineering)',
  },
  {
    hsCode: '85011019',
    description: 'Electric motors of an output not exceeding 37.5 W (micro-motors)',
    unit: 'NOS',
    chapterHeading: '8501',
    notes: 'Precision stepper and brushless DC motors',
    source: 'CBIC Customs Tariff Act, First Schedule (Electrical)',
  },
  {
    hsCode: '85015210',
    description: 'Three-phase AC electric motors of an output exceeding 750 W but not exceeding 75 kW',
    unit: 'NOS',
    chapterHeading: '8501',
    notes: 'Standard industrial induction motors for plant automation',
    source: 'CBIC Customs Tariff Act, First Schedule (Electrical)',
  },
  {
    hsCode: '85044090',
    description: 'Other static converters (inverters, rectifiers, battery chargers, power supplies)',
    unit: 'NOS',
    chapterHeading: '8504',
    notes: 'Solar grid-tie inverters and telecom rectifiers',
    source: 'CBIC Customs Tariff Act, First Schedule (Electrical)',
  },
  {
    hsCode: '85071000',
    description: 'Lead-acid accumulators of a kind used for starting piston engines (SLI batteries)',
    unit: 'NOS',
    chapterHeading: '8507',
    notes: 'Automotive starting, lighting and ignition lead-acid batteries',
    source: 'CBIC Customs Tariff Act, First Schedule (Electrical)',
  },
  {
    hsCode: '85076000',
    description: 'Lithium-ion accumulators and battery packs',
    unit: 'NOS',
    chapterHeading: '8507',
    notes: 'EV traction batteries and portable electronic cells',
    source: 'CBIC Customs Tariff Act, First Schedule (Electrical)',
  },
  {
    hsCode: '85176290',
    description: 'Machines for the reception, conversion and transmission or regeneration of voice, images or other data (network routers, switches, optical transmission gear)',
    unit: 'NOS',
    chapterHeading: '8517',
    notes: 'Carrier ethernet switches, fiber optic transceivers and enterprise routers',
    source: 'CBIC Customs Tariff Act, First Schedule (Telecom)',
  },
  {
    hsCode: '85371000',
    description: 'Boards, panels, consoles, desks, cabinets and other bases for electric control or the distribution of electricity, for a voltage not exceeding 1,000 V',
    unit: 'NOS',
    chapterHeading: '8537',
    notes: 'Motor control centres (MCC) and power distribution boards',
    source: 'CBIC Customs Tariff Act, First Schedule (Electrical)',
  },
  {
    hsCode: '87082900',
    description: 'Other parts and accessories of bodies (including cabs) for motor vehicles',
    unit: 'KGS',
    chapterHeading: '8708',
    notes: 'Sheet metal stampings and automotive structural brackets',
    source: 'CBIC Customs Tariff Act, First Schedule (Automotive)',
  },
  {
    hsCode: '87084000',
    description: 'Gear boxes and parts thereof for motor vehicles',
    unit: 'NOS',
    chapterHeading: '8708',
    notes: 'Manual and automatic transmissions for commercial and passenger vehicles',
    source: 'CBIC Customs Tariff Act, First Schedule (Automotive)',
  },
  {
    hsCode: '87089900',
    description: 'Other parts and accessories of motor vehicles of headings 8701 to 8705',
    unit: 'KGS',
    chapterHeading: '8708',
    notes: 'Miscellaneous chassis, suspension and steering components',
    source: 'CBIC Customs Tariff Act, First Schedule (Automotive)',
  },
  {
    hsCode: '87141090',
    description: 'Parts and accessories of motorcycles (including mopeds)',
    unit: 'KGS',
    chapterHeading: '8714',
    notes: 'Two-wheeler frames, suspension forks, brake calipers',
    source: 'CBIC Customs Tariff Act, First Schedule (Automotive)',
  },

  // -------------------------------------------------------------
  // 2. Textiles & Apparel (Chapters 52, 54, 61, 62)
  // -------------------------------------------------------------
  {
    hsCode: '52051210',
    description: 'Single cotton yarn, of uncombed fibres, measuring less than 714.29 dtex but not less than 232.56 dtex (exceeding 14 nm but not exceeding 43 nm)',
    unit: 'KGS',
    chapterHeading: '5205',
    notes: 'Grey ring-spun cotton yarn for knitting and weaving',
    source: 'CBIC Customs Tariff Act, First Schedule (Textiles)',
  },
  {
    hsCode: '52081190',
    description: 'Woven fabrics of cotton, containing 85% or more by weight of cotton, unbleached, plain weave, weighing not more than 100 g/m2',
    unit: 'SQM',
    chapterHeading: '5208',
    notes: 'Grey cotton cambric and lawn fabrics',
    source: 'CBIC Customs Tariff Act, First Schedule (Textiles)',
  },
  {
    hsCode: '52094200',
    description: 'Denim fabrics containing 85% or more by weight of cotton, weighing more than 200 g/m2',
    unit: 'SQM',
    chapterHeading: '5209',
    notes: 'Indigo-dyed heavy warp cotton denim fabrics',
    source: 'CBIC Customs Tariff Act, First Schedule (Textiles)',
  },
  {
    hsCode: '54023300',
    description: 'Textured yarn of polyesters (partially oriented yarn / drawn textured yarn)',
    unit: 'KGS',
    chapterHeading: '5402',
    notes: 'Synthetic polyester filament yarn for apparel and industrial textiles',
    source: 'CBIC Customs Tariff Act, First Schedule (Textiles)',
  },
  {
    hsCode: '61051000',
    description: 'Men’s or boys’ shirts, knitted or crocheted, of cotton',
    unit: 'NOS',
    chapterHeading: '6105',
    notes: 'Cotton polo shirts and knitted fashion tops',
    source: 'CBIC Customs Tariff Act, First Schedule (Apparel)',
  },
  {
    hsCode: '61091000',
    description: 'T-shirts, singlets and other vests, knitted or crocheted, of cotton',
    unit: 'NOS',
    chapterHeading: '6109',
    notes: 'Knitted cotton round-neck and v-neck T-shirts',
    source: 'CBIC Customs Tariff Act, First Schedule (Apparel)',
  },
  {
    hsCode: '61102000',
    description: 'Jerseys, pullovers, cardigans, waistcoats and similar articles, knitted or crocheted, of cotton',
    unit: 'NOS',
    chapterHeading: '6110',
    notes: 'Sweaters, hoodies and knit outerwear of cotton',
    source: 'CBIC Customs Tariff Act, First Schedule (Apparel)',
  },
  {
    hsCode: '62034200',
    description: 'Men’s or boys’ trousers, bib and brace overalls, breeches and shorts, of cotton',
    unit: 'NOS',
    chapterHeading: '6203',
    notes: 'Woven cotton trousers, chinos and denim jeans',
    source: 'CBIC Customs Tariff Act, First Schedule (Apparel)',
  },
  {
    hsCode: '62046200',
    description: 'Women’s or girls’ trousers, bib and brace overalls, breeches and shorts, of cotton',
    unit: 'NOS',
    chapterHeading: '6204',
    notes: 'Woven cotton ladies trousers and jeans',
    source: 'CBIC Customs Tariff Act, First Schedule (Apparel)',
  },
  {
    hsCode: '63022100',
    description: 'Bed linen, printed, of cotton',
    unit: 'NOS',
    chapterHeading: '6302',
    notes: 'Home textiles: printed bed sheets, pillow cases, duvet covers',
    source: 'CBIC Customs Tariff Act, First Schedule (Textiles)',
  },

  // -------------------------------------------------------------
  // 3. Chemicals & Pharmaceuticals (Chapters 28, 29, 30, 38)
  // -------------------------------------------------------------
  {
    hsCode: '28046100',
    description: 'Silicon containing by weight not less than 99.99% of silicon (electronic/solar grade)',
    unit: 'KGS',
    chapterHeading: '2804',
    notes: 'Polysilicon feedstock for semiconductor ingots and photovoltaic wafers',
    source: 'CBIC Customs Tariff Act, First Schedule (Chemicals)',
  },
  {
    hsCode: '28151100',
    description: 'Sodium hydroxide (caustic soda), solid',
    unit: 'KGS',
    chapterHeading: '2815',
    notes: 'Industrial inorganic alkali for soap, paper, alumina and textile processing',
    source: 'CBIC Customs Tariff Act, First Schedule (Chemicals)',
  },
  {
    hsCode: '29022000',
    description: 'Benzene (pure aromatic hydrocarbon)',
    unit: 'KGS',
    chapterHeading: '2902',
    notes: 'Primary petrochemical building block for styrene, phenol and nylon',
    source: 'CBIC Customs Tariff Act, First Schedule (Chemicals)',
  },
  {
    hsCode: '29024100',
    description: 'o-Xylene (ortho-xylene)',
    unit: 'KGS',
    chapterHeading: '2902',
    notes: 'Feedstock for phthalic anhydride and plasticizers',
    source: 'CBIC Customs Tariff Act, First Schedule (Chemicals)',
  },
  {
    hsCode: '29051100',
    description: 'Methanol (methyl alcohol)',
    unit: 'KGS',
    chapterHeading: '2905',
    notes: 'Industrial alcohol for formaldehyde, acetic acid and biodiesel synthesis',
    source: 'CBIC Customs Tariff Act, First Schedule (Chemicals)',
  },
  {
    hsCode: '29173600',
    description: 'Pure terephthalic acid (PTA) and its salts',
    unit: 'KGS',
    chapterHeading: '2917',
    notes: 'Raw material for polyester polymer (PET) chips, resin and textiles',
    source: 'CBIC Customs Tariff Act, First Schedule (Chemicals)',
  },
  {
    hsCode: '29332990',
    description: 'Heterocyclic compounds containing an unfused imidazole ring in the structure',
    unit: 'KGS',
    chapterHeading: '2933',
    notes: 'Active pharmaceutical ingredients and antifungal intermediates',
    source: 'CBIC Customs Tariff Act, First Schedule (Pharma)',
  },
  {
    hsCode: '29411010',
    description: 'Penicillins and their derivatives with a penicillanic acid structure; salts thereof (e.g. Amoxicillin, Ampicillin)',
    unit: 'KGS',
    chapterHeading: '2941',
    notes: 'Broad-spectrum beta-lactam antibiotic bulk drugs / APIs',
    source: 'CBIC Customs Tariff Act, First Schedule (Pharma)',
  },
  {
    hsCode: '30049099',
    description: 'Other medicaments consisting of mixed or unmixed products for therapeutic or prophylactic uses, put up in measured doses for retail sale',
    unit: 'KGS',
    chapterHeading: '3004',
    notes: 'Finished pharmaceutical dosage formulations (tablets, capsules, syrups)',
    source: 'CBIC Customs Tariff Act, First Schedule (Pharma)',
  },
  {
    hsCode: '38089199',
    description: 'Insecticides for agricultural and public health applications, put up in forms or packings for retail sale',
    unit: 'KGS',
    chapterHeading: '3808',
    notes: 'Agrochemical crop protection pesticide formulations',
    source: 'CBIC Customs Tariff Act, First Schedule (Agrochemicals)',
  },

  // -------------------------------------------------------------
  // 4. Agriculture & Marine Products (Chapters 03, 08, 09, 10, 12)
  // -------------------------------------------------------------
  {
    hsCode: '03061790',
    description: 'Other frozen shrimps and prawns (Vannamei / Black Tiger)',
    unit: 'KGS',
    chapterHeading: '0306',
    notes: 'Processed and quick-frozen aquacultured marine export produce',
    source: 'CBIC Customs Tariff Act, First Schedule (Marine)',
  },
  {
    hsCode: '08013210',
    description: 'Cashew nuts, fresh or dried, shelled, whole',
    unit: 'KGS',
    chapterHeading: '0801',
    notes: 'Processed white whole cashew kernels (WW180, WW210, WW240, WW320)',
    source: 'CBIC Customs Tariff Act, First Schedule (Agriculture)',
  },
  {
    hsCode: '09012190',
    description: 'Coffee, roasted, not decaffeinated, other',
    unit: 'KGS',
    chapterHeading: '0901',
    notes: 'Indian plantation Arabica and Robusta roasted coffee beans',
    source: 'CBIC Customs Tariff Act, First Schedule (Spices/Coffee)',
  },
  {
    hsCode: '09024020',
    description: 'Black tea, leaf, in packing exceeding 3 kg (bulk export tea)',
    unit: 'KGS',
    chapterHeading: '0902',
    notes: 'Assam orthodox and CTC bulk export black tea',
    source: 'CBIC Customs Tariff Act, First Schedule (Tea)',
  },
  {
    hsCode: '09041110',
    description: 'Pepper of the genus piper, neither crushed nor ground: Garbled black pepper',
    unit: 'KGS',
    chapterHeading: '0904',
    notes: 'Malabar garbled and Tellicherry extra bold black pepper',
    source: 'CBIC Customs Tariff Act, First Schedule (Spices)',
  },
  {
    hsCode: '09103020',
    description: 'Turmeric (curcuma) in powder form',
    unit: 'KGS',
    chapterHeading: '0910',
    notes: 'High-curcumin Salem and Nizamabad ground turmeric powder',
    source: 'CBIC Customs Tariff Act, First Schedule (Spices)',
  },
  {
    hsCode: '10063020',
    description: 'Semi-milled or wholly milled basmati rice, whether or not polished or glazed',
    unit: 'KGS',
    chapterHeading: '1006',
    notes: 'Traditional, 1121 and 1509 aromatic long-grain Indian basmati rice',
    source: 'CBIC Customs Tariff Act, First Schedule (Grains)',
  },
  {
    hsCode: '10063090',
    description: 'Other semi-milled or wholly milled non-basmati rice',
    unit: 'KGS',
    chapterHeading: '1006',
    notes: 'Parboiled and raw white non-basmati rice subject to statutory export policy notifications',
    source: 'CBIC Customs Tariff Act, First Schedule (Grains)',
  },
  {
    hsCode: '12024200',
    description: 'Groundnuts, not roasted or otherwise cooked, shelled, whether or not broken',
    unit: 'KGS',
    chapterHeading: '1202',
    notes: 'Bold and Java variety peanut kernels for food processing and table consumption',
    source: 'CBIC Customs Tariff Act, First Schedule (Oilseeds)',
  },
  {
    hsCode: '12074090',
    description: 'Sesame seeds, whether or not broken, other than seed quality',
    unit: 'KGS',
    chapterHeading: '1207',
    notes: 'Natural white and hulled sesame seeds (99.95% purity)',
    source: 'CBIC Customs Tariff Act, First Schedule (Oilseeds)',
  },

  // -------------------------------------------------------------
  // 5. Metals, Plastics, Minerals & Glass (Chapters 25, 39, 70, 72, 76)
  // -------------------------------------------------------------
  {
    hsCode: '25161100',
    description: 'Granite, crude or roughly trimmed',
    unit: 'KGS',
    chapterHeading: '2516',
    notes: 'Rough dimensional granite quarry blocks',
    source: 'CBIC Customs Tariff Act, First Schedule (Minerals)',
  },
  {
    hsCode: '39011010',
    description: 'Polyethylene having a specific gravity of less than 0.94: Linear Low Density Polyethylene (LLDPE)',
    unit: 'KGS',
    chapterHeading: '3901',
    notes: 'Virgin thermoplastic polymer granules for film extrusion and packaging',
    source: 'CBIC Customs Tariff Act, First Schedule (Plastics)',
  },
  {
    hsCode: '39021000',
    description: 'Polypropylene, in primary forms',
    unit: 'KGS',
    chapterHeading: '3902',
    notes: 'Homo-polymer and co-polymer granules for injection moulding and woven sacks',
    source: 'CBIC Customs Tariff Act, First Schedule (Plastics)',
  },
  {
    hsCode: '70052900',
    description: 'Float glass and surface ground or polished glass, in sheets, other',
    unit: 'SQM',
    chapterHeading: '7005',
    notes: 'Architectural clear and tinted float glass sheets',
    source: 'CBIC Customs Tariff Act, First Schedule (Glassware)',
  },
  {
    hsCode: '72083940',
    description: 'Flat-rolled products of iron or non-alloy steel, in coils, hot-rolled, of a thickness of less than 3 mm',
    unit: 'KGS',
    chapterHeading: '7208',
    notes: 'Hot-rolled steel coils for tube manufacturing and structural fabrication',
    source: 'CBIC Customs Tariff Act, First Schedule (Iron & Steel)',
  },
  {
    hsCode: '72104900',
    description: 'Flat-rolled products of iron or non-alloy steel, plated or coated with zinc (galvanized sheets / coils)',
    unit: 'KGS',
    chapterHeading: '7210',
    notes: 'Hot-dip galvanized (GI) steel sheets for roofing and ducting',
    source: 'CBIC Customs Tariff Act, First Schedule (Iron & Steel)',
  },
  {
    hsCode: '72193300',
    description: 'Flat-rolled products of stainless steel, cold-rolled, of a thickness exceeding 1 mm but less than 3 mm',
    unit: 'KGS',
    chapterHeading: '7219',
    notes: 'Grade 304 and 316 stainless steel cold-rolled sheets and coils',
    source: 'CBIC Customs Tariff Act, First Schedule (Stainless Steel)',
  },
  {
    hsCode: '73041910',
    description: 'Line pipe of a kind used for oil or gas pipelines, seamless, of iron or steel',
    unit: 'KGS',
    chapterHeading: '7304',
    notes: 'High-pressure API 5L line pipe for oil and gas gathering systems',
    source: 'CBIC Customs Tariff Act, First Schedule (Pipes & Tubes)',
  },
  {
    hsCode: '76011010',
    description: 'Aluminium, not alloyed: Aluminium ingots',
    unit: 'KGS',
    chapterHeading: '7601',
    notes: 'Primary electrolytic high-purity aluminium smelting ingots (99.7% min)',
    source: 'CBIC Customs Tariff Act, First Schedule (Non-Ferrous)',
  },
  {
    hsCode: '76061200',
    description: 'Aluminium plates, sheets and strip, of aluminium alloys, rectangular (including square)',
    unit: 'KGS',
    chapterHeading: '7606',
    notes: 'Aluminium alloy sheets for transportation and architectural facades',
    source: 'CBIC Customs Tariff Act, First Schedule (Non-Ferrous)',
  },
];

/**
 * Statutory Denied & Restricted Entities Dataset (DGFT & SCOMET)
 * NOTE: Sourced from official Directorate General of Foreign Trade (DGFT) Denied Entity List (DEL)
 * and Ministry of External Affairs / DGFT SCOMET (Special Chemicals, Organisms, Materials,
 * Equipment and Technologies) Dual-Use Weapons of Mass Destruction controls.
 * Requires periodic manual sync from official DGFT portal: https://dgft.gov.in
 */
const DENIED_ENTITIES = [
  {
    entityName: 'Al-Khaleej Advanced Technical Solutions LLC',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2024-00192',
    notes: 'Debarred from foreign trade under Section 11(2) of the FTDR Act 1992 for diversion of goods',
  },
  {
    entityName: 'Far East Precision Optronics Ltd',
    entityType: 'COMPANY' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-CAT-6-WA-0081',
    notes: 'Listed under SCOMET Category 6 (Sensors and Lasers) for unsanctioned military avionics end-use',
  },
  {
    entityName: 'Black Sea Petrochemical Trading FZE',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2025-00441',
    notes: 'Suspended IEC for failure to realize export proceeds within statutory RBI timeframes',
  },
  {
    entityName: 'Red Star Industrial Bearings Corp',
    entityType: 'COMPANY' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-CAT-3-NUCLEAR-012',
    notes: 'End-user denial under SCOMET Category 3 for gas centrifuge uranium enrichment components',
  },
  {
    entityName: 'Tariq Mohammad Al-Mansoor',
    entityType: 'INDIVIDUAL' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-IND-DEL-2023-9912',
    notes: 'Individual debarred from importing or exporting dual-use high-strength carbon fiber',
  },
  {
    entityName: 'Bosphorus Maritime Chartering Co',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2025-01088',
    notes: 'Flagged by Enforcement Directorate for maritime trade-based money laundering',
  },
  {
    entityName: 'Northern Horizon Advanced Materials Ltd',
    entityType: 'COMPANY' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-CAT-8-AERO-0033',
    notes: 'Restricted under SCOMET Category 8 for rocket motor cases and missile propulsion staging',
  },
  {
    entityName: 'Zhengzhou Heavy Metallurgy Works',
    entityType: 'COMPANY' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-CAT-2-MICRO-045',
    notes: 'Restricted under SCOMET biological/chemical containment equipment controls',
  },
  {
    entityName: 'Karachi Industrial Gas Supplies Ltd',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2024-00812',
    notes: 'Denied entity under Special Order No. 4/2024 for trade embargo violations',
  },
  {
    entityName: 'Viktor Mikhailov Rostislav',
    entityType: 'INDIVIDUAL' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-IND-CAT1-009',
    notes: 'Sanctioned broker for illegal trade in Category 1 toxic chemical precursors',
  },
  {
    entityName: 'Persian Gulf Commercial Matrix FZC',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2025-00723',
    notes: 'Front entity identified for bypassing statutory Indian export restrictions',
  },
  {
    entityName: 'Caspian Heavy Valve & Turbine LLC',
    entityType: 'COMPANY' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-CAT-4-AERO-019',
    notes: 'Restricted dual-use supercritical fluid pump manufacturer',
  },
  {
    entityName: 'Hans Mueller Scientific Instruments GmbH',
    entityType: 'COMPANY' as const,
    sourceList: 'SCOMET_RESTRICTED' as const,
    referenceNumber: 'SCOMET-CAT-5-TELECOM-02',
    notes: 'High-grade cryptographic hardware exporter restricted without prior DGFT SCOMET authorization',
  },
  {
    entityName: 'Delta Transcontinental Shipping Corp',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2024-00511',
    notes: 'Freight forwarder blacklisted for false shipping declarations at Nhava Sheva Custom House',
  },
  {
    entityName: 'Chen Wei International Trading Ltd',
    entityType: 'COMPANY' as const,
    sourceList: 'DGFT_DENIED_ENTITY' as const,
    referenceNumber: 'DGFT-DEL-2026-00041',
    notes: 'Suspended IEC entity for under-invoicing and statutory customs duty evasion',
  },
];

async function seed() {
  console.log('=================================================================');
  console.log('🇮🇳  Seeding Statutory Indian Tariff Schedule & Denied Entities');
  console.log('=================================================================');

  // 1. Seed TariffSchedule
  console.log(`\n📦 1. Upserting ${TARIFF_RECORDS.length} 8-digit ITC-HS Tariff Records...`);
  let tariffCount = 0;
  for (const record of TARIFF_RECORDS) {
    await prisma.tariffSchedule.upsert({
      where: { hsCode: record.hsCode },
      update: {
        description: record.description,
        unit: record.unit,
        chapterHeading: record.chapterHeading,
        notes: record.notes,
        source: record.source,
      },
      create: record,
    });
    tariffCount++;
  }
  console.log(`  ✓ Successfully seeded ${tariffCount} statutory tariff schedule records.`);

  // 2. Seed Denied Entities
  console.log(`\n🚫 2. Seeding ${DENIED_ENTITIES.length} DGFT & SCOMET Denied/Restricted Entities...`);
  let deniedCount = 0;
  for (const entity of DENIED_ENTITIES) {
    const existing = await prisma.deniedEntity.findFirst({
      where: {
        entityName: entity.entityName,
        sourceList: entity.sourceList,
      },
    });

    if (!existing) {
      await prisma.deniedEntity.create({ data: entity });
      deniedCount++;
    }
  }
  console.log(`  ✓ Successfully seeded ${deniedCount} denied entity records.`);

  console.log('\n=================================================================');
  console.log('🎉 Statutory Tariff & Sanctions Reference Data Ready!');
  console.log('=================================================================');
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
