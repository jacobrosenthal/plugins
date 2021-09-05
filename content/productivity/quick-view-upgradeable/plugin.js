// Quick view Upgradeable  
//
//  Description:
//   This plugin give you the opportunity to upgrade single planets per selection from map/list of planets with overview amount of silver. 
//   Or Upgrade whole empire with specific upgrade.
//
//   Remixed from Quick-upgrade + Upgrade able planets list 
//

import {
  html,
  render,
  useState,
  useEffect,
} from 'https://unpkg.com/htm/preact/standalone.module.js';

import {
  eachLimit
} from 'https://cdn.skypack.dev/async-es';

import {
  Defense,
  Range,
  Speed,
} from 'https://plugins.zkga.me/game/Icons.js';

import {
  canStatUpgrade,
  canPlanetUpgrade,
  getPlanetRank,
  getSilver,
  getSilverNeeded,
} from 'https://plugins.zkga.me/utils/utils.js';

import {
  PlanetType,
  UpgradeBranchName,
  SpaceType
} from "https://cdn.skypack.dev/@darkforest_eth/types"

const { getPlanetName } = df.getProcgenUtils();

// 30 seconds
let REFRESH_INTERVAL = 1000 * 30;

function upgrade(planet, branch) {
  if (planet && canPlanetUpgrade(planet) && canStatUpgrade(planet, branch)) {
    df.upgrade(planet.locationId, branch)
  }
}

const getPlanetMaxRank = (planet) => {
  if (!planet) return 0;

  if (planet.spaceType === SpaceType.NEBULA) return 3;
  else if (planet.spaceType === SpaceType.SPACE) return 4;
  else return 5;
};

const dfyellow = '#e8e228';
const subbertext = '#565656';

function Subber({ children }) {
  return html`<span style=${{ color: subbertext, padding: '0 5px' }}>${children}</span>`;
}

function Gold({ children }) {
  return html`<span style=${{ color: dfyellow, padding: '0 5px' }}>${children}</span>`;
}

function SilverRequired({ planet }) {
  const maxRank = getPlanetMaxRank(planet);
  const silverPerRank = [];

  for (let i = 0; i < maxRank; i++) {
    silverPerRank[i] = Math.floor((i + 1) * 0.2 * planet.silverCap);
  }

  return silverPerRank.map((silver, i) => (
    html`<span key=${i}>
      ${i === getPlanetRank(planet) ? html`<${Gold}>${silver}<//>` : html`<${Subber}>${silver}<//>`}
    </span>`
  ))
}

function UpgradeButton({ Icon, planet, branch }) {
  let isEnabled = canPlanetUpgrade(planet) && canStatUpgrade(planet, branch);

  let button = {
    opacity: isEnabled ? '1' : '0.5',
  };

  let label = {
    marginLeft: '5px',
  };

  let [iconColor, setIconColor] = useState('white');

  function colorBlack() {
    setIconColor('black');
  }

  function colorWhite() {
    setIconColor('white');
  }

  function onClick() {
    upgrade(planet, branch);
  }

  return html`
    <button style=${button} disabled=${!isEnabled} onClick=${onClick} onMouseOver=${colorBlack} onMouseOut=${colorWhite}>
      <${Icon} pathStyle=${{ fill: iconColor }} />
      <span style=${label}>Lvl ${planet.upgradeState[branch]}</span>
    </button>
  `;
}

function UpgradeAllButton({ Icon, branch, onFeedback }) {
  let button = {
    paddingLeft: '10px',
    paddingRight: '10px',
  };

  let [iconColor, setIconColor] = useState('white');

  function colorBlack() {
    setIconColor('black');
  }

  function colorWhite() {
    setIconColor('white');
  }

  function onClick() {
    let myPlanets = df.getMyPlanets()
      .filter(planet => canPlanetUpgrade(planet) && canStatUpgrade(planet, branch));
    onFeedback(`Queueing ${myPlanets.length} planet upgrades.`);

    if (myPlanets.length === 0) {
      onFeedback('No planet upgrades to queue.');
      return;
    }

    eachLimit(myPlanets, 1, (planet, cb) => {
      setTimeout(() => {
        upgrade(planet, branch);
        cb();
      }, 250);
    }, () => {
      onFeedback('Planet upgrades queued!');
    });
  }

  return html`
    <button style=${button} onClick=${onClick} onMouseOver=${colorBlack} onMouseOut=${colorWhite}>
      <${Icon} pathStyle=${{ fill: iconColor }} />
    </button>
  `;
}

function UpgradeSelectedPlanet({ planet }) {
  let wrapper = {
    display: 'flex',
    justifyContent: 'space-between',
  };

  if (!planet) {
    return html`
      <div style=${wrapper}>
        No planet selected or cannot upgrade.
      </div>
    `;
  }
  return html`
    <div style=${wrapper}>
      <span>Selected:</span>
      <${UpgradeButton} Icon=${Defense} planet=${planet} branch=${UpgradeBranchName.Defense} />
      <${UpgradeButton} Icon=${Range} planet=${planet} branch=${UpgradeBranchName.Range} />
      <${UpgradeButton} Icon=${Speed} planet=${planet} branch=${UpgradeBranchName.Speed} />
    </div>
  `;
}

function UpgradeAllPlanets() {
  let wrapper = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  };

  let [feedback, setFeedback] = useState(null);

  return html`
    <div style=${wrapper}>
      <span>All planets:</span>
      <${UpgradeAllButton} Icon=${Defense} branch=${UpgradeBranchName.Defense} onFeedback=${setFeedback} />
      <${UpgradeAllButton} Icon=${Range} branch=${UpgradeBranchName.Range} onFeedback=${setFeedback} />
      <${UpgradeAllButton} Icon=${Speed} branch=${UpgradeBranchName.Speed} onFeedback=${setFeedback} />
    </div>
    <div>
      ${feedback}
    </div>
  `;
}

function App() {
  let [selectedPlanet, setSelectedPlanet] = useState(() => {
    const planet = ui.getSelectedPlanet();
    if (!planet) {
      return undefined;
    }
    if (planet.planetType === PlanetType.PLANET) {
      return planet;
    } else {
      return undefined;
    }
  });

  useEffect(() => {
    const sub = ui.selectedPlanetId$.subscribe(planetId => {
      setSelectedPlanet(() => {
        const planet = df.getPlanetWithId(planetId);
        if (!planet) {
          return undefined;
        }

        if (planet.planetType === PlanetType.PLANET && planet.planetLevel > 0) {
          return planet;
        } else {
          return undefined;
        }
      })
    });

    return sub.unsubscribe;
  }, []);

  return html`
    <div>
      <${UpgradeSelectedPlanet} planet=${selectedPlanet} />
      ${selectedPlanet ? html`<br /><span>Silver: ${Math.floor(selectedPlanet.silver)}</span>` : null}
      ${selectedPlanet ? html`<br /><span>Required:</span><${SilverRequired} planet=${selectedPlanet} />` : null}
      <br />
      <hr />
      <${UpgradeAllPlanets} />
    </div>
  `;
}

class Plugin {
  constructor() {
    this.container = null;
    this.lastLocationId = null;
    this.loopId = null;

    this.planetList = document.createElement('div');
    this.planetList.style.maxHeight = '100px';
    this.planetList.style.overflowX = 'hidden';
    this.planetList.style.overflowY = 'scroll';
  }

  clearPlanetList = () => {
    this.planetList.innerHTML = '';
    this.planetList.innerText = '';
  }

  allPlanetsWithUpgrade() {
    return Array.from(df.getMyPlanets())
      .filter(canPlanetUpgrade)
      .sort((p1, p2) => parseInt(p2.planetLevel, 10) - parseInt(p1.planetLevel, 10));
  }

  renderSelectable = (planet, text) => {
    let content = document.createElement('span');
    content.innerText = text;
    let { x, y } = planet.location.coords;
    content.onclick = () => {
      this.centerPlanet({ x, y })
    };
    return content;
  }

  renderUpgradable = () => {
    this.clearPlanetList();

    let planets = this.allPlanetsWithUpgrade()
    let title = document.createElement('div');
    title.style.marginBottom = '10px';
    title.style.display = 'flex';
    title.style.justifyContent = 'space-between';
    title.innerText = `${planets.length} planets ready for upgrade!`;

    this.planetList.appendChild(title);

    for (let planet of planets) {
      if (planet.location) {
        let planetEntry = document.createElement('div');
        planetEntry.style.marginBottom = '10px';
        planetEntry.style.display = 'flex';
        planetEntry.style.justifyContent = 'space-between';
        planetEntry.dataset.locationId = planet.locationId;

        this.colorSelected(planetEntry);

        let text = `${getPlanetName(planet)} - Lvl ${planet.planetLevel} - ${getSilver(planet)} / ${getSilverNeeded(planet)} silver`;
        let content = this.renderSelectable(planet, text)
        planetEntry.appendChild(content);

        this.planetList.appendChild(planetEntry);
      }
    }

    // 1 because the title is always there
    if (this.planetList.children.length === 1) {
      this.planetList.innerHTML = 'No planets to upgrade right now.';
    }
  };

  centerPlanet = (coords) => {
    let planet = df.getPlanetWithCoords(coords);
    if (planet) {
      this.lastLocationId = planet.locationId;
    }

    ui.centerPlanet(planet);

    if (this.planetList) {
      Array.from(this.planetList.children)
        .forEach(this.colorSelected);
    }
  }

  colorSelected = (el) => {
    if (el.dataset.locationId === this.lastLocationId) {
      el.style.color = 'pink';
    } else {
      el.style.color = '';
    }
  }

  render(container) {
    container.parentElement.style.minHeight = 'unset';
    container.style.width = '325px';
    container.style.minHeight = 'unset';

    this.container = container;

    render(html`<${App} />`, container);

    container.style.width = '400px';
    let contentPane = document.createElement('div');
    container.appendChild(contentPane);

    this.renderUpgradable();
    this.loopId = setInterval(this.renderUpgradable, REFRESH_INTERVAL);

    contentPane.appendChild(this.planetList);
  }

  destroy() {
    render(null, this.container);
    if (this.loopId) {
      clearInterval(this.loopId)
    }
  }
}

export default Plugin;
