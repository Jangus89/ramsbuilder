const RULES = [
  {
    id: 'ground-disturbance-services',
    title: 'Ground Disturbance / Underground Services',
    triggers: ['excavat', 'trench', 'saw cutting', 'sawcut', 'road repair', 'carriageway', 'footway', 'breaking', 'break out', 'coring', 'drilling', 'post', 'stake', 'groundwork', 'dig'],
    hazard: 'Underground services strike during ground disturbance, saw cutting, breaking out, coring, drilling or excavation.',
    controls: [
      'Review statutory utility plans and site service drawings before works.',
      'Complete CAT and Genny scan by a competent person and mark detected services.',
      'Use permit to dig/cut where required by site rules or client procedures.',
      'Use trial holes/hand digging near suspected services and maintain exclusion zones.',
      'Stop work and escalate if unidentified services, ducts, covers or warning tape are found.',
      'Brief operatives on emergency service strike procedure.',
    ],
    validatorKeywords: ['underground', 'buried service', 'utility', 'cat', 'genny', 'permit to dig', 'service strike'],
  },
  {
    id: 'live-traffic-highways',
    title: 'Live Traffic / Highway Interface',
    triggers: ['road', 'highway', 'carriageway', 'lane', 'traffic', 'vehicle', 'footway', 'kerb', 'tm', 'chapter 8'],
    hazard: 'Vehicle incursion and interface with live traffic during highway or road works.',
    controls: [
      'Implement suitable temporary traffic management before works start.',
      'Use cones, barriers, signs and pedestrian segregation appropriate to the road environment.',
      'Maintain safe access/egress and avoid operatives stepping into live lanes.',
      'Use competent traffic management operatives where required.',
      'Wear high-visibility clothing and maintain work zone lighting/visibility.',
    ],
    validatorKeywords: ['traffic management', 'live traffic', 'vehicle incursion', 'chapter 8', 'cones', 'barriers'],
  },
  {
    id: 'public-interface',
    title: 'Public Interface',
    triggers: ['public', 'pedestrian', 'school', 'retail', 'residential', 'footpath', 'footway', 'client access', 'live site'],
    hazard: 'Members of the public entering or being affected by the work area.',
    controls: [
      'Segregate the work area with barriers, signage and controlled access points.',
      'Maintain safe pedestrian routes and consider vulnerable persons.',
      'Use a marshal/banksman where public interface cannot be fully segregated.',
      'Plan noisy, dusty or disruptive tasks to reduce public exposure.',
    ],
    validatorKeywords: ['public', 'pedestrian', 'segregation', 'barrier', 'marshal', 'vulnerable'],
  },
  {
    id: 'work-at-height',
    title: 'Work at Height',
    triggers: ['height', 'roof', 'ladder', 'scaffold', 'mewp', 'edge', 'fragile', 'steps', 'fall'],
    hazard: 'Falls of people or materials from height.',
    controls: [
      'Apply the work at height hierarchy and avoid work at height where practicable.',
      'Use inspected access equipment, edge protection and fall prevention controls.',
      'Exclude people below and control falling objects.',
      'Prepare a rescue plan where fall arrest or MEWP work is used.',
    ],
    validatorKeywords: ['work at height', 'edge protection', 'ladder', 'scaffold', 'mewp', 'rescue plan', 'fall'],
  },
  {
    id: 'lifting-operations',
    title: 'Lifting Operations',
    triggers: ['crane', 'hiab', 'telehandler', 'lifting', 'sling', 'hoist', 'load', 'loler'],
    hazard: 'Dropped load, overturning plant or uncontrolled lifting operation.',
    controls: [
      'Prepare a suitable lifting plan and appoint competent persons.',
      'Use LOLER-compliant lifting equipment and pre-use checks.',
      'Establish exclusion zones and controlled communications.',
      'Confirm ground bearing capacity and overhead obstructions.',
    ],
    validatorKeywords: ['lifting plan', 'loler', 'slinger', 'signaller', 'exclusion zone', 'ground bearing'],
  },
  {
    id: 'overhead-services',
    title: 'Overhead Services',
    triggers: ['overhead', 'power line', 'telegraph', 'pole', 'crane', 'mewp', 'excavator', 'tipper', 'boom'],
    hazard: 'Contact or arcing from overhead services.',
    controls: [
      'Identify overhead services and confirm exclusion distances before work.',
      'Use goalposts, height restrictors and plant movement controls where required.',
      'Brief plant operators and use a spotter when operating near overhead services.',
      'Consult utility owner where safe distances cannot be assured.',
    ],
    validatorKeywords: ['overhead', 'power line', 'exclusion distance', 'goalpost', 'height restrictor', 'spotter'],
  },
  {
    id: 'electrical-isolation',
    title: 'Electrical Isolation',
    triggers: ['electrical isolation', 'isolate electrical', 'electrical panel', 'distribution board', 'live electrical', 'lock off', 'lockout', 'energised'],
    hazard: 'Electric shock, arc flash or unexpected energisation.',
    controls: [
      'Isolate, lock off and tag electrical systems before work.',
      'Prove dead using suitable calibrated test equipment.',
      'Use competent electricians for electrical work.',
      'Control re-energisation and maintain permit/authorisation records.',
    ],
    validatorKeywords: ['isolate', 'lock off', 'prove dead', 'competent electrician', 'arc flash', 'energisation'],
  },
  {
    id: 'confined-space',
    title: 'Confined Space',
    triggers: ['confined', 'chamber', 'manhole', 'tank', 'pit', 'culvert', 'void', 'sewer', 'restricted access'],
    hazard: 'Confined space atmosphere, entrapment or rescue difficulty.',
    controls: [
      'Complete confined space assessment and permit where required.',
      'Gas test before and during entry and provide ventilation.',
      'Use trained entrants, top person and communications.',
      'Prepare rescue arrangements before entry.',
    ],
    validatorKeywords: ['confined space', 'gas test', 'ventilation', 'rescue', 'top person', 'permit'],
  },
  {
    id: 'hot-works-fire',
    title: 'Hot Works / Fire',
    triggers: ['hot work', 'welding', 'grinding', 'cutting torch', 'flame', 'spark', 'heat gun', 'burner'],
    hazard: 'Fire or explosion from hot works, sparks or ignition sources.',
    controls: [
      'Use hot works permit and fire watch where required.',
      'Remove or protect combustible materials.',
      'Provide suitable extinguishers and emergency arrangements.',
      'Control gas cylinders and ignition sources.',
    ],
    validatorKeywords: ['hot works permit', 'fire watch', 'extinguisher', 'combustible', 'spark', 'ignition'],
  },
  {
    id: 'asbestos-suspect-materials',
    title: 'Asbestos / Suspect Materials',
    triggers: ['asbestos', 'refurbishment', 'demolition', 'old building', 'lagging', 'insulation board', 'textured coating', 'soffit'],
    hazard: 'Exposure to asbestos-containing or suspect materials.',
    controls: [
      'Review asbestos survey/register before intrusive works.',
      'Stop work if suspect materials are discovered.',
      'Use licensed contractor or suitable controls where required.',
      'Prevent disturbance and isolate affected area pending assessment.',
    ],
    validatorKeywords: ['asbestos', 'survey', 'register', 'licensed contractor', 'suspect material', 'stop work'],
  },
  {
    id: 'silica-dust',
    title: 'Silica / Dust',
    triggers: ['concrete', 'silica', 'dust', 'cutting', 'grinding', 'drilling', 'chasing', 'breaking', 'saw'],
    hazard: 'Respirable crystalline silica and nuisance dust exposure.',
    controls: [
      'Use water suppression or on-tool extraction at source.',
      'Use suitable RPE with face-fit testing where required.',
      'Segregate dusty work and prevent dry sweeping.',
      'Clean down using wet methods or suitable vacuum equipment.',
    ],
    validatorKeywords: ['silica', 'dust', 'water suppression', 'extraction', 'rpe', 'face fit'],
  },
  {
    id: 'noise-vibration',
    title: 'Noise / Vibration',
    triggers: ['breaker', 'saw', 'grinder', 'compactor', 'drill', 'vibration', 'noise', 'cutting'],
    hazard: 'Noise-induced hearing damage and hand-arm vibration exposure.',
    controls: [
      'Assess HAVS and noise exposure and limit trigger time.',
      'Use low-vibration maintained tools and rotate tasks.',
      'Provide hearing protection zones where required.',
      'Record exposure and brief operatives on symptoms/reporting.',
    ],
    validatorKeywords: ['havs', 'vibration', 'noise', 'hearing protection', 'trigger time', 'tool rotation'],
  },
  {
    id: 'coshh-substances',
    title: 'COSHH Substances',
    triggers: ['fuel', 'cement', 'resin', 'paint', 'solvent', 'adhesive', 'bitumen', 'chemical', 'oil'],
    hazard: 'Hazardous substance exposure or incorrect storage/use.',
    controls: [
      'Review SDS/COSHH assessments before use.',
      'Control exposure routes with PPE, ventilation and hygiene.',
      'Store substances securely and segregate incompatibles.',
      'Provide spill response and disposal arrangements.',
    ],
    validatorKeywords: ['coshh', 'sds', 'substance', 'exposure', 'spill', 'storage'],
  },
  {
    id: 'plant-pedestrian-interface',
    title: 'Plant / Pedestrian Interface',
    triggers: ['excavator', 'dumper', 'telehandler', 'roller', 'forklift', 'plant', 'reversing', 'loading', 'vehicle'],
    hazard: 'Collision or crush injury from plant and pedestrian interface.',
    controls: [
      'Segregate plant and pedestrians with exclusion zones.',
      'Use banksman/reversing controls where required.',
      'Complete plant pre-use checks and use competent operators.',
      'Maintain visibility, alarms, beacons and seatbelt use.',
    ],
    validatorKeywords: ['plant', 'pedestrian', 'banksman', 'reversing', 'exclusion zone', 'pre-use'],
  },
  {
    id: 'machinery-work-equipment',
    title: 'Machinery / Work Equipment',
    triggers: ['machinery', 'machine', 'saw', 'breaker', 'grinder', 'drill', 'cutter', 'compactor', 'powered tool', 'work equipment', 'puwer'],
    hazard: 'Entanglement, contact, ejection, cuts, crushing or other injury from machinery and powered work equipment.',
    controls: [
      'Use suitable PUWER-compliant equipment for the task and environment.',
      'Complete pre-use checks and remove defective equipment from service.',
      'Keep guards, handles, emergency stops and safety devices in place and functional.',
      'Use competent, briefed operatives and follow manufacturer instructions.',
      'Control loose clothing, cables, hoses, kickback, flying debris and exclusion zones.',
    ],
    validatorKeywords: ['machinery', 'work equipment', 'puwer', 'guard', 'pre-use', 'defective', 'manufacturer'],
  },
  {
    id: 'mobile-plant',
    title: 'Mobile Plant',
    triggers: ['mobile plant', 'excavator', 'dumper', 'roller', 'telehandler', 'forklift', 'loader', 'skid steer', 'reversing', 'plant movement', 'compact plant'],
    hazard: 'Collision, overturning, crush injury or property damage from mobile plant operations.',
    controls: [
      'Use competent authorised operators and inspected plant only.',
      'Segregate mobile plant from workers, pedestrians, public and live traffic.',
      'Use banksman, exclusion zones and clear communication where visibility or reversing is restricted.',
      'Confirm ground conditions, gradients, edges, overhead restrictions and operating routes.',
      'Maintain seatbelt use, beacons, alarms, mirrors/cameras and speed controls.',
    ],
    validatorKeywords: ['mobile plant', 'operator', 'banksman', 'reversing', 'segregation', 'seatbelt', 'beacon'],
  },
  {
    id: 'manual-handling',
    title: 'Manual Handling',
    triggers: ['manual handling', 'lifting', 'carry', 'slab', 'kerb', 'bag', 'material', 'awkward'],
    hazard: 'Musculoskeletal injury from lifting, carrying or awkward handling.',
    controls: [
      'Avoid manual handling where possible using mechanical aids.',
      'Plan routes, weights and team lifts.',
      'Brief operatives on safe handling techniques.',
      'Break down loads and avoid twisting/overreaching.',
    ],
    validatorKeywords: ['manual handling', 'mechanical aid', 'team lift', 'weight', 'route'],
  },
  {
    id: 'excavation-collapse',
    title: 'Excavation Collapse / Ground Instability',
    triggers: ['excavat', 'trench', 'deep dig', 'shoring', 'batter', 'made ground', 'unstable ground'],
    hazard: 'Excavation collapse, falls into excavation or unstable ground conditions.',
    controls: [
      'Assess ground conditions and use battering, stepping or shoring as required.',
      'Keep spoil, plant and materials away from excavation edges.',
      'Provide edge protection and safe access/egress.',
      'Inspect excavations after weather, vibration or change in conditions.',
    ],
    validatorKeywords: ['excavation', 'collapse', 'shoring', 'batter', 'spoil', 'edge protection'],
  },
  {
    id: 'water-contamination',
    title: 'Water / Drowning / Contamination',
    triggers: ['water', 'river', 'drain', 'culvert', 'flood', 'dewatering', 'sewer', 'standing water'],
    hazard: 'Drowning, contaminated water exposure or drainage pollution.',
    controls: [
      'Assess water hazards and provide rescue arrangements where relevant.',
      'Protect drains and watercourses from silt, fuel and waste.',
      'Control exposure to contaminated water and apply hygiene controls.',
      'Plan dewatering discharge routes and permits where required.',
    ],
    validatorKeywords: ['water', 'drain', 'watercourse', 'rescue', 'pollution', 'contamination'],
  },
  {
    id: 'environmental-spill',
    title: 'Environmental Spill / Pollution',
    triggers: ['fuel', 'hydraulic', 'oil', 'plant', 'refuelling', 'generator', 'watercourse', 'drain'],
    hazard: 'Fuel, oil or material release causing environmental harm.',
    controls: [
      'Use spill kits, drip trays and designated refuelling areas.',
      'Protect drains and watercourses before work.',
      'Store fuel/chemicals securely and away from ignition/drainage routes.',
      'Escalate and clean spills using approved procedure.',
    ],
    validatorKeywords: ['spill', 'drip tray', 'refuelling', 'drain', 'watercourse', 'pollution'],
  },
  {
    id: 'weather-exposure',
    title: 'Weather / Temperature Exposure',
    triggers: ['outdoor', 'roof', 'highway', 'winter', 'heat', 'rain', 'wind', 'ice', 'night'],
    hazard: 'Adverse weather affecting worker health, visibility or site conditions.',
    controls: [
      'Monitor weather and stop work when conditions become unsafe.',
      'Control slips, poor visibility, heat/cold stress and wind exposure.',
      'Provide lighting, hydration, rest breaks and suitable clothing as required.',
    ],
    validatorKeywords: ['weather', 'wind', 'rain', 'heat', 'cold', 'visibility', 'slip'],
  },
  {
    id: 'lone-working',
    title: 'Lone Working / Remote Works',
    triggers: ['lone', 'isolated', 'out of hours', 'remote', 'single operative', 'small crew'],
    hazard: 'Delayed emergency response during lone, remote or out-of-hours work.',
    controls: [
      'Use check-in procedure and reliable communications.',
      'Escalate missed check-ins and maintain emergency contacts.',
      'Do not undertake high-risk work alone unless specifically assessed and authorised.',
    ],
    validatorKeywords: ['lone working', 'check-in', 'communication', 'emergency contact', 'remote'],
  },
];

function normalise(value) {
  return String(value || '').toLowerCase();
}

export function detectCriticalRiskRules({ taskType, taskDescription, additionalInfo, answers }) {
  const answerText = answers
    ? Object.values(answers).map(answer => `${answer.question || ''} ${answer.answer || ''}`).join(' ')
    : '';
  const haystack = normalise([taskType, taskDescription, additionalInfo, answerText].filter(Boolean).join(' '));
  return RULES.filter(rule => rule.triggers.some(trigger => haystack.includes(trigger)));
}

export function buildCriticalRiskPrompt(rules) {
  if (!rules.length) return '';
  const blocks = rules.map(rule => {
    const controls = rule.controls.map(control => `  - ${control}`).join('\n');
    return `- ${rule.title}\n  Mandatory hazard: ${rule.hazard}\n  Mandatory controls:\n${controls}`;
  });
  return `\n\nCRITICAL RISK REQUIREMENTS - these are non-negotiable. The RAMS must include a specific hazard entry or clearly equivalent controls for every matched rule below:\n${blocks.join('\n\n')}\n`;
}

export function validateCriticalRisks(ramsData, rules) {
  const hazards = (ramsData?.hazards || [])
    .map(hazard => `${hazard.hazard || ''} ${hazard.controls || ''} ${hazard.thoseAtRisk || ''}`)
    .join(' ')
    .toLowerCase();

  return rules
    .map(rule => {
      const matched = rule.validatorKeywords.some(keyword => hazards.includes(keyword.toLowerCase()));
      return matched ? null : {
        id: rule.id,
        title: rule.title,
        hazard: rule.hazard,
        requiredControls: rule.controls,
      };
    })
    .filter(Boolean);
}
