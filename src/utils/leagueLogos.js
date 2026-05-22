// League logo URLs from api-sports CDN (no auth required)
// Keys match exact league names from the backend SPORT_KEY_MAP (normalised)
const LOGO_MAP = {
  'premier league':           'https://media.api-sports.io/football/leagues/39.png',
  'championship':             'https://media.api-sports.io/football/leagues/40.png',
  'la liga':                  'https://media.api-sports.io/football/leagues/140.png',
  'bundesliga':               'https://media.api-sports.io/football/leagues/78.png',
  'serie a':                  'https://media.api-sports.io/football/leagues/135.png',
  'ligue 1':                  'https://media.api-sports.io/football/leagues/61.png',
  'eredivisie':               'https://media.api-sports.io/football/leagues/88.png',
  'primeira liga':            'https://media.api-sports.io/football/leagues/94.png',
  'scottish premiership':     'https://media.api-sports.io/football/leagues/179.png',
  'belgian first division a': 'https://media.api-sports.io/football/leagues/144.png',
  'super lig':                'https://media.api-sports.io/football/leagues/203.png',
  'mls':                      'https://media.api-sports.io/football/leagues/253.png',
  'liga mx':                  'https://media.api-sports.io/football/leagues/262.png',
  'brasileirao':              'https://media.api-sports.io/football/leagues/71.png',
  'primera division':         'https://media.api-sports.io/football/leagues/128.png',
  'uefa champions league':    'https://media.api-sports.io/football/leagues/2.png',
  'champions league':         'https://media.api-sports.io/football/leagues/2.png',
  'uefa europa league':       'https://media.api-sports.io/football/leagues/3.png',
  'europa league':            'https://media.api-sports.io/football/leagues/3.png',
  'copa libertadores':        'https://media.api-sports.io/football/leagues/13.png',
  'copa sudamericana':        'https://media.api-sports.io/football/leagues/11.png',
  'copa america':             'https://media.api-sports.io/football/leagues/9.png',
  'afc asian cup':            'https://media.api-sports.io/football/leagues/17.png',
  'africa cup of nations':    'https://media.api-sports.io/football/leagues/6.png',
  'concacaf gold cup':        'https://media.api-sports.io/football/leagues/16.png',
  'uefa conference league':   'https://media.api-sports.io/football/leagues/848.png',
  'conference league':        'https://media.api-sports.io/football/leagues/848.png',
  'uefa euro':                'https://media.api-sports.io/football/leagues/4.png',
  'euro qualifiers':          'https://media.api-sports.io/football/leagues/29.png',
  'uefa nations league':      'https://media.api-sports.io/football/leagues/5.png',
  'world cup':                'https://media.api-sports.io/football/leagues/1.png',
  'world cup qualifiers':     'https://media.api-sports.io/football/leagues/29.png',
  'liga argentina':           'https://media.api-sports.io/football/leagues/128.png',
  'belgian pro league':       'https://media.api-sports.io/football/leagues/144.png',
  'international friendlies': 'https://media.api-sports.io/football/leagues/10.png',
}

// Strip combining diacritics: Süper→super, Brasileirão→brasileirao, División→division
function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function getLeagueLogo(name) {
  if (!name) return null
  const n = normalize(name)
  if (LOGO_MAP[n]) return LOGO_MAP[n]
  for (const [key, url] of Object.entries(LOGO_MAP)) {
    const k = key // keys already normalised (no accents)
    if (n.includes(k) || k.includes(n)) return url
  }
  return null
}
