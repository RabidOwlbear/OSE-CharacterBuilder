import { registerRetainerBuilder } from './retainer-builder.js';
import { initializeUtils } from './util.mjs';
import { osrCharacterBuilder } from './character-builder/character-builder.mjs';
import { registerSrdDataEn } from './data/srd-data-en.mjs';
import { registerSrdDataEs } from './data/srd-data-es.mjs';
import { hideForeignPacks, intializePackFolders } from './util.mjs';
import { registerSettings } from './settings.mjs';
import { socket } from './cb-socket.mjs';

Hooks.once('init', async () => {
  //register namespace
  window.OSRCB = window.OSRCB || {};
  OSRCB.moduleName = `osr-character-builder`;
  OSRCB.util = OSRCB.util || {};
  OSRCB.data = OSRCB.data || {};
  OSRCB.spells = OSRCB.spells || { mergedList: {} };
  OSRCB.spells.mergedList = {};
  OSRCB.characterBuilder = osrCharacterBuilder;
  OSRCB.lang = ['en', 'es'];
  OSRCB.socket = socket;
  socket.registerSocket();

  // import modules
  //registerCharacterBuilder();

  registerRetainerBuilder();
  initializeUtils();
  registerSettings();
});
Hooks.once('ready', async () => {
  switch (game.i18n.lang) {
    case 'en':
      registerSrdDataEn();
      break;
    case 'es':
      registerSrdDataEs();
      break;
    default:
      registerSrdDataEn();
  }
  // set hook to hide display of foreign language packs
  await intializePackFolders();
  hideForeignPacks();

  //reset external classes
  if (game.user.isGM) await game.settings.set(`${OSRCB.moduleName}`, 'externalClasses', []);
  const oseModName = 'old-school-essentials';
  const srdObj = {};
  if (game.user.role >= 4) {
    let oseActive = await game.modules.get(oseModName)?.active;
    if (oseActive) {
      await game.settings.set('osr-character-builder', 'defaultClasses', [
        {
          name: 'basic',
          menu: 'OSE Basic',
          default: true,
          classes: OSE.data.classes.basic
        },
        {
          name: 'advanced',
          menu: 'OSE Advanced',
          default: false,
          classes: OSE.data.classes.advanced
        }
      ]);
    } else {
      await game.settings.set('osr-character-builder', 'defaultClasses', [
        {
          name: 'SRD',
          menu: 'SRD',
          default: true,
          classes: OSRCB.data.SRDClassData
        }
      ]);
    }
    Hooks.callAll('OseCharacterClassAdded');
  }
  Hooks.callAll('OSRCB Registered');
});

//on actor sheet load, add helper buttons to sheet
Hooks.on('renderActorSheet', (actorObj, html) => {
  const actor = actorObj.actor;
  const modBox = html.find(`[class="modifiers-btn"]`);
  const defCharBtn = html.find(`.profile .blinking`)[0];
  if (defCharBtn) defCharBtn.style.display = 'none';
  const classSelected = actor.getFlag(`${OSRCB.moduleName}`, 'classSelected');

  if (actor.system?.scores?.str?.value == 0) {
    modBox.append(
      `<a class="osr-icon osr-choose-class" title="Character Builder"><i class="fas fa-user-shield"></i></a>`
    );
    modBox.on('click', '.osr-choose-class', async (event) => {
      const dataObj = OSRCB.util.mergeClassOptions();
      OSRCB.util.renderCharacterBuilder(actor, dataObj);

    });
  }
});