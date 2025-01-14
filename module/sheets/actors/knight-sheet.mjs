import {
  getModStyle,
  listEffects,
  getSpecial,
  SortByName,
  SortByAddOrder,
  sum,
  confirmationDialog,
  getEffets
} from "../../helpers/common.mjs";

import { KnightRollDialog } from "../../dialog/roll-dialog.mjs";
import toggler from '../../helpers/toggler.js';

/**
 * @extends {ActorSheet}
 */
export class KnightSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["knight", "sheet", "actor"],
      template: "systems/knight/templates/actors/knight-sheet.html",
      width: 920,
      height: 720,
      tabs: [
        {navSelector: ".sheet-tabs", contentSelector: ".body", initial: "personnage"}
      ],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const context = super.getData();

    //EGIDE
    const dataJauges = context.data.system.jauges;
    const hasEgide = game.settings.get("knight", "acces-egide");

    if(hasEgide) {
        dataJauges.egide = true;
    } else {
        dataJauges.egide = false;
    }

    this._prepareCharacterItems(context);

    context.actor.caracteristiques = {};

    for (let [key, aspect] of Object.entries(context.data.system.aspects)){
      const traAspect = game.i18n.localize(CONFIG.KNIGHT.aspects[key]);
      const sCompanions = context.actor.armureData?.system?.capacites?.selected?.companions || false;
      const sCompanionsLegende = context.actor.armureLegendeData?.system?.capacites?.selected?.companions || false;

      aspect.label = traAspect;

      if(sCompanions != false) {
        const sCAE = sCompanions.lion.aspects[key].ae;
        const sCWAE = sCompanions.wolf.aspects[key].ae;
        const mineur = game.i18n.localize('KNIGHT.AUTRE.Mineur');
        const majeur = game.i18n.localize('KNIGHT.AUTRE.Majeur');

        sCompanions.lion.aspects[key].label = traAspect;
        sCompanions.wolf.aspects[key].label = traAspect;
        sCompanions.crow.aspects[key].label = traAspect;

        if(sCAE > 5) {
          sCompanions.lion.aspects[key].labelAE = majeur;
        } else {
          sCompanions.lion.aspects[key].labelAE = mineur;
        }

        if(sCWAE > 5) {
          sCompanions.wolf.aspects[key].labelAE = majeur;
        } else {
          sCompanions.wolf.aspects[key].labelAE = mineur;
        }
      }

      if(sCompanionsLegende != false) {
        const sCAE = sCompanionsLegende.lion.aspects[key].ae;
        const sCWAE = sCompanionsLegende.wolf.aspects[key].ae;
        const mineur = game.i18n.localize('KNIGHT.AUTRE.Mineur');
        const majeur = game.i18n.localize('KNIGHT.AUTRE.Majeur');

        sCompanionsLegende.lion.aspects[key].label = traAspect;
        sCompanionsLegende.wolf.aspects[key].label = traAspect;
        sCompanionsLegende.crow.aspects[key].label = traAspect;

        if(sCAE > 5) {
          sCompanionsLegende.lion.aspects[key].labelAE = majeur;
        } else {
          sCompanionsLegende.lion.aspects[key].labelAE = mineur;
        }

        if(sCWAE > 5) {
          sCompanionsLegende.wolf.aspects[key].labelAE = majeur;
        } else {
          sCompanionsLegende.wolf.aspects[key].labelAE = mineur;
        }
      }

      for (let [keyCar, carac] of Object.entries(aspect.caracteristiques)){
        carac.label = game.i18n.localize(CONFIG.KNIGHT.caracteristiques[keyCar]);

        context.actor.caracteristiques[keyCar] = {};
        context.actor.caracteristiques[keyCar].value = carac?.value || 0;
        context.actor.caracteristiques[keyCar].od = carac?.overdrive?.value || 0;

        this._prepareOverdrives(key, keyCar, carac, context);
      }
    }

    for (let [key, nods] of Object.entries(context.data.system.combat.nods)){
      nods.label = game.i18n.localize(CONFIG.KNIGHT.nods[key]);
    }

    for (let [key, grenades] of Object.entries(context.data.system.combat.grenades.liste)){
      const raw = grenades.effets.raw;
      const custom = grenades.effets.custom;
      const labels = CONFIG.KNIGHT.effets;

      grenades.liste = listEffects(raw, custom, labels);
    }

    this._prepareCapacitesTranslations(context);
    this._prepareSpecialTranslations(context);
    this._prepareModuleTranslation(context);
    this._prepareCapacitesParameters(context);
    this._prepareWpnEffets(context);
    this._maxValue(context);

    context.systemData = context.data.system;

    return context;
  }

  /**
     * Return a light sheet if in "limited" state
     * @override
     */
   get template() {
    if (!game.user.isGM && this.actor.limited) {
      return "systems/knight/templates/actors/limited-sheet.html";
    }
    return this.options.template;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('div.grenades img.info').click(ev => {
      const span = $(ev.currentTarget).siblings("span.hideInfo")
      span.width($(html).width()/2).toggle("display");
      $(ev.currentTarget).toggleClass("clicked")
    });

    html.find('div.combat div.armesContact img.info').click(ev => {
      const span = $(ev.currentTarget).siblings("span.hideInfo")
      const width = $(ev.currentTarget).parents("div.main").width() / 2;
      const isW50 = $(ev.currentTarget).parents("div.wpn").width();
      let position = "";
      let borderRadius = "border-top-right-radius";

      if(isW50 <= width) {
        if($(ev.currentTarget).parents("div.wpn").position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      } else {
        if($(ev.currentTarget).parent().position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      }

      span.width($(html).width()/2).css(position, "0px").css(borderRadius, "0px").toggle("display");
      $(ev.currentTarget).toggleClass("clicked");
    });

    html.find('div.combat div.armesDistance img.info').click(ev => {
      const span = $(ev.currentTarget).siblings("span.hideInfo")
      const width = $(ev.currentTarget).parents("div.main").width() / 2;
      const isW50 = $(ev.currentTarget).parents("div.wpn").width();
      let position = "";
      let borderRadius = "border-top-right-radius";

      if(isW50 <= width) {
        if($(ev.currentTarget).parents("div.wpn").position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      } else {
        if($(ev.currentTarget).parent().position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      }

      span.width($(html).width()/2).css(position, "0px").css(borderRadius, "0px").toggle("display");
      $(ev.currentTarget).toggleClass("clicked");
    });

    html.find('div.progression div.evolutionsAAcheter button').hover(ev => {
      const span = html.find('div.progression div.evolutionsAAcheter span.hideInfo');
      const target = $(ev.currentTarget);
      const width = html.find('div.progression div.evolutionsAAcheter').width() / 2;

      if(target.position().left > width) {
        span.toggleClass("right");
      } else {
        span.toggleClass("left");
      }
    });

    toggler.init(this.id, html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    html.find('img.option').click(ev => {
      const option = $(ev.currentTarget).data("option");
      const actuel = this.getData().data.system[option]?.optionDeploy || false;

      let result = false;
      if(actuel) {
        result = false;
      } else {
        result = true;
      }

      const update = {
        system: {
          [option]: {
            optionDeploy:result
          }
        }
      };

      this.actor.update(update);
    });

    html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find('.item-edit').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      if(item.type === 'armure') {
        this._resetArmureCapacites();
      }

      if(item.type === 'module') {
        this._resetArmureModules();
      }

      item.sheet.render(true);
    });

    html.find('.item-delete').click(async ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      if(!await confirmationDialog()) return;

      if(item.type === 'armure') {
        const idLegende = this._getArmorLegendeId();

        if(idLegende !== 0) {
          const armorLegende = this.actor.items.get(idLegende);

          armorLegende.delete();
        }

        const update = {
          system:{
            equipements:{
              armure:{
                id:0,
                hasArmor:false,
                hasArmorLegende:false,
                idLegende:0
              }
            },
            wear:'tenueCivile'
          }
        };

        this.actor.update(update);
        this._resetArmure();
      }

      if(item.type === 'module') {
        this._resetArmureModules();
      }

      item.delete();
      header.slideUp(200, () => this.render(false));
    });

    html.find('div.combat div.armesContact select.wpnMainChange').change(ev => {
      const target = $(ev.currentTarget);
      const id = target.data("id");
      const value = target.val();

      this.actor.items.get(id).update({['system.options2mains.actuel']:value});
    });

    html.find('div.combat div.armesDistance select.wpnMunitionChange').change(ev => {
      const target = $(ev.currentTarget);
      const id = target.data("id");
      const value = target.val();

      this.actor.items.get(id).update({['system.optionsmunitions.actuel']:value});
    });

    html.find('div.armure section.buttonTabs a').click(ev => {
      const target = $(ev.currentTarget);
      const tab = target.data("tab");

      const update = {};

      switch(tab) {
        case 'MAarmure':
          update[`system.MATabs`] = {
            'MAarmure':true,
            'MAmodule':false,
            'MAia':false,
          };
          break;
        case 'MAmodule':
          update[`system.MATabs`] = {
            'MAarmure':false,
            'MAmodule':true,
            'MAia':false,
          };
          break;
        case 'MAia':
          update[`system.MATabs`] = {
            'MAarmure':false,
            'MAmodule':false,
            'MAia':true,
          };
          break;
      }

      this.actor.update(update);
    });

    html.find('section.menu div.armure input.value').change(ev => {
      const target = $(ev.currentTarget);
      const value = target.val();

      this._updatePA(value);
    });

    html.find('.armure .activation').click(async ev => {
      const target = $(ev.currentTarget);
      const type = target.data("type");
      const toupdate = target.data("toupdate");
      const id = target.data("id");
      const special = target.data("special");
      const retrieve = target.data("depense");
      const name = target.data("name");
      const value = target.data("value") ? false : true;
      const hasFlux = target.data("flux") || false;
      const flux = hasFlux != false ? eval(hasFlux) : false;
      const cout = eval(target.data("cout"));
      const isAllie = target.data("isallie");
      const nbreC = target.data("nbrec") || 0;
      const capacite = target.data("capacite");
      const variant = target.data("variant");
      const module = target.data("module");
      const dEspoir = target.data("despoir");
      const espoir = target.data("espoir");
      const caracteristiques = target.data("caracteristiques")?.split('.')?.filter((a) => a) || false;

      const getData = this.getData();
      const armure = this.actor.items.get(this._getArmorId());
      const remplaceEnergie = armure.system.espoir.remplaceEnergie || false;
      const equipcapacites = getData.data.system.equipements.armure.capacites;
      const armorCapacites = getData.actor.armureData.system.capacites.selected;

      if(value) {
        const coutCalcule = remplaceEnergie && armure.system.espoir.cout > 0 && type === 'module' ? Math.max(Math.floor(cout / armure.system.espoir.cout), 1) : cout;
        const depense = await this._depensePE(name, coutCalcule, true, false, flux);

        if(!depense) return;
      }

      let depenseEspoir;
      let newActor;

      let update = {};
      let specialUpdate = {};


      if(type === 'capacites') {
        switch(capacite) {
          case "ascension":
            if(value) {
              let data = getData.data.system;
              data.wear = "ascension";
              data.energie.value = cout;

              let newItems = getData.items.filter(items => items.system.rarete !== 'prestige');
              newItems.find(item => item.type === 'armure').system.energie.base = cout;

              newActor = await Actor.create({
                name: `${name} : ${this.title}`,
                type: "knight",
                img:armure.img,
                items:newItems,
                system:data,
                permission:this.actor.ownership,
                folder:this.actor.folder
              });

              armure.update({[`system.${toupdate}`]:{
                active:true,
                depense:cout,
                ascensionId:newActor.id
              }});

              if(remplaceEnergie) this.actor.update({['system.espoir.malus.armure']:cout+this.getData().data.system.espoir.malus?.armure||0});
              else armure.update({[`system.energie.base`]:getData.data.system.energie.max-cout});
            } else {
              const actor = game.actors.get(id);

              if(actor !== undefined) await actor.delete();

              armure.update({[`system.${toupdate}`]:{
                active:false,
                ascensionId:0,
                depense:0
              }});

              if(remplaceEnergie) this.actor.update({['system.espoir.malus.armure']:getData.data.system.espoir.malus.armure-retrieve});
              else armure.update({[`system.energie.base`]:getData.data.system.energie.max+retrieve});
            }
            break;
          case "borealis":
            armure.update({[`system.${toupdate}`]:value});
            break;
          case "changeling":
            armure.update({[`system.${toupdate}`]:value});
            break;
          case "companions":
            update[`system.${toupdate}.base`] = value;
            update[`system.${toupdate}.${special}`] = value;

            if(value) {
              if(!remplaceEnergie) update[`system.energie.malus.companions`] = retrieve;
              else this.actor.update({[[`system.espoir.malus.companions`]]:retrieve});

              switch(special) {
                case 'lion':
                  const dataLion = armorCapacites.companions.lion;

                  const dataLChair = dataLion.aspects.chair;
                  const dataLBete = dataLion.aspects.bete;
                  const dataLMachine = dataLion.aspects.machine;
                  const dataLDame = dataLion.aspects.dame;
                  const dataLMasque = dataLion.aspects.masque;

                  const lionAEChairMin = dataLChair.ae > 4 ? 0 : dataLChair.ae;
                  const lionAEChairMaj = dataLChair.ae < 5 ? 0 : dataLChair.ae;

                  const lionAEBeteMin = dataLBete.ae > 4 ? 0 : dataLBete.ae;
                  const lionAEBeteMaj = dataLBete.ae < 5 ? 0 : dataLBete.ae;

                  const lionAEMachineMin = dataLMachine.ae > 4 ? 0 : dataLMachine.ae;
                  const lionAEMachineMaj = dataLMachine.ae < 5 ? 0 : dataLMachine.ae;

                  const lionAEDameMin = dataLDame.ae > 4 ? 0 : dataLDame.ae;
                  const lionAEDameMaj = dataLDame.ae < 5 ? 0 : dataLDame.ae;

                  const lionAEMasqueMin = dataLMasque.ae > 4 ? 0 : dataLMasque.ae;
                  const lionAEMasqueMaj = dataLMasque.ae < 5 ? 0 : dataLMasque.ae;

                  newActor = await Actor.create({
                    name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.LION.Label")}`,
                    type: "pnj",
                    img:dataLion.img,
                    system:{
                      "aspects": {
                        "chair":{
                          "value":dataLChair.value,
                          "ae":{
                            "mineur":{
                              "value":lionAEChairMin
                            },
                            "majeur":{
                              "value":lionAEChairMaj
                            }
                          }
                        },
                        "bete":{
                          "value":dataLBete.value,
                          "ae":{
                            "mineur":{
                              "value":lionAEBeteMin
                            },
                            "majeur":{
                              "value":lionAEBeteMaj
                            }
                          }
                        },
                        "machine":{
                          "value":dataLMachine.value,
                          "ae":{
                            "mineur":{
                              "value":lionAEMachineMin
                            },
                            "majeur":{
                              "value":lionAEMachineMaj
                            }
                          }
                        },
                        "dame":{
                          "value":dataLDame.value,
                          "ae":{
                            "mineur":{
                              "value":lionAEDameMin
                            },
                            "majeur":{
                              "value":lionAEDameMaj
                            }
                          }
                        },
                        "masque":{
                          "value":dataLMasque.value,
                          "ae":{
                            "mineur":{
                              "value":lionAEMasqueMin
                            },
                            "majeur":{
                              "value":lionAEMasqueMaj
                            }
                          }
                        }
                      },
                      "energie":{
                        "base":retrieve,
                        "value":retrieve,
                      },
                      "champDeForce":{
                        "base":dataLion.champDeForce.base,
                      },
                      "armure":{
                        "value":dataLion.armure.value,
                        "base":dataLion.armure.base
                      },
                      "initiative":{
                        "diceBase":dataLion.initiative.value,
                        "bonus":{
                          "user":dataLion.initiative.fixe,
                        }
                      },
                      "defense":{
                        "base":dataLion.defense.value
                      },
                      "reaction":{
                        "base":dataLion.reaction.value
                      },
                      "options":{
                        "resilience":false,
                        "sante":false,
                        "espoir":false,
                        "bouclier":false,
                        "noCapacites":true,
                        "modules":true,
                        "phase2":false
                      }
                    },
                    items:dataLion.modules,
                    folder:this.actor.folder,
                    permission:this.actor.ownership
                  });

                  const nLItems = [];

                  const nLItem = {
                    name:dataLion.armes.contact.coups.label,
                    type:'arme',
                    system:{
                      type:'contact',
                      portee:dataLion.armes.contact.coups.portee,
                      degats:{
                        dice:dataLion.armes.contact.coups.degats.dice,
                        fixe:dataLion.armes.contact.coups.degats.fixe
                      },
                      violence:{
                        dice:dataLion.armes.contact.coups.violence.dice,
                        fixe:dataLion.armes.contact.coups.violence.fixe
                      },
                      effets:{
                        raw:dataLion.armes.contact.coups.effets.raw,
                        custom:dataLion.armes.contact.coups.effets.custom
                      }
                  }};

                  nLItems.push(nLItem);

                  await newActor.createEmbeddedDocuments("Item", nLItems);

                  update[`system.capacites.selected.companions.lion.id`] = newActor.id
                  break;

                case 'wolf':
                  let newActor2;
                  let newActor3;

                  const dataWolf = armorCapacites.companions.wolf;

                  const dataWChair = dataWolf.aspects.chair;
                  const dataWBete = dataWolf.aspects.bete;
                  const dataWMachine = dataWolf.aspects.machine;
                  const dataWDame = dataWolf.aspects.dame;
                  const dataWMasque = dataWolf.aspects.masque;

                  const dataActor = {
                    "aspects": {
                      "chair":{
                        "value":dataWChair.value
                      },
                      "bete":{
                        "value":dataWBete.value
                      },
                      "machine":{
                        "value":dataWMachine.value
                      },
                      "dame":{
                        "value":dataWDame.value
                      },
                      "masque":{
                        "value":dataWMasque.value
                      }
                    },
                    "energie":{
                      "base":retrieve,
                      "value":retrieve,
                    },
                    "champDeForce":{
                      "base":dataWolf.champDeForce.base,
                    },
                    "armure":{
                      "value":dataWolf.armure.base,
                      "base":dataWolf.armure.base
                    },
                    "initiative":{
                      "diceBase":dataWolf.initiative.value,
                      "bonus":{
                        "user":dataWolf.initiative.fixe,
                      }
                    },
                    "defense":{
                      "base":dataWolf.defense.base
                    },
                    "reaction":{
                      "base":dataWolf.reaction.base
                    },
                    "wolf":dataWolf.configurations,
                    "configurationActive":'',
                    "options":{
                      "resilience":false,
                      "sante":false,
                      "espoir":false,
                      "bouclier":false,
                      "modules":false,
                      "noCapacites":true,
                      "wolfConfiguration":true
                    }
                  };

                  newActor = await Actor.create({
                    name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.Label")} 1`,
                    type: "pnj",
                    img:dataWolf.img,
                    system:dataActor,
                    folder:this.actor.folder,
                    permission:this.actor.ownership
                  });

                  newActor2 = await Actor.create({
                    name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.Label")} 2`,
                    type: "pnj",
                    img:dataWolf.img,
                    system:dataActor,
                    folder:this.actor.folder,
                    permission:this.actor.ownership
                  });

                  newActor3 = await Actor.create({
                    name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.Label")} 3`,
                    type: "pnj",
                    img:dataWolf.img,
                    system:dataActor,
                    folder:this.actor.folder,
                    permission:this.actor.ownership
                  });

                  const nWItems = [];

                  const nWItem = {
                    name:dataWolf.armes.contact.coups.label,
                    type:'arme',
                    system:{
                      type:'contact',
                      portee:dataWolf.armes.contact.coups.portee,
                      degats:{
                        dice:dataWolf.armes.contact.coups.degats.dice,
                        fixe:dataWolf.armes.contact.coups.degats.fixe
                      },
                      violence:{
                        dice:dataWolf.armes.contact.coups.violence.dice,
                        fixe:dataWolf.armes.contact.coups.violence.fixe
                      },
                      effets:{
                        raw:dataWolf.armes.contact.coups.effets.raw,
                        custom:dataWolf.armes.contact.coups.effets.custom
                      }
                  }};

                  nWItems.push(nWItem);

                  await newActor.createEmbeddedDocuments("Item", nWItems);
                  await newActor2.createEmbeddedDocuments("Item", nWItems);
                  await newActor3.createEmbeddedDocuments("Item", nWItems);

                  update[`system.capacites.selected.companions.wolf.id`] = {
                    id1:newActor.id,
                    id2:newActor2.id,
                    id3:newActor3.id
                  };
                  break;

                case 'crow':
                  const dataCrow = armorCapacites.companions.crow;

                  const dataCChair = dataCrow.aspects.chair;
                  const dataCBete = dataCrow.aspects.bete;
                  const dataCMachine = dataCrow.aspects.machine;
                  const dataCDame = dataCrow.aspects.dame;
                  const dataCMasque = dataCrow.aspects.masque;

                  newActor = await Actor.create({
                    name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.CROW.Label")}`,
                    type: "bande",
                    img:dataCrow.img,
                    system:{
                      "aspects": {
                        "chair":{
                          "value":dataCChair.value
                        },
                        "bete":{
                          "value":dataCBete.value
                        },
                        "machine":{
                          "value":dataCMachine.value
                        },
                        "dame":{
                          "value":dataCDame.value
                        },
                        "masque":{
                          "value":dataCMasque.value
                        }
                      },
                      "energie":{
                        "value":retrieve,
                        "max":retrieve,
                      },
                      "champDeForce":{
                        "base":dataCrow.champDeForce.base,
                      },
                      "sante":{
                        "value":dataCrow.cohesion.base,
                        "base":dataCrow.cohesion.base
                      },
                      "initiative":{
                        "diceBase":dataCrow.initiative.value,
                        "bonus":{
                          "user":dataCrow.initiative.fixe,
                        }
                      },
                      "defense":{
                        "base":dataCrow.defense.value
                      },
                      "reaction":{
                        "base":dataCrow.reaction.value
                      },
                      "debordement":{
                        "value":dataCrow.debordement.base
                      },
                      "options":{
                        "resilience":false,
                        "sante":false,
                        "espoir":false,
                        "bouclier":false,
                        "noCapacites":true,
                        "energie":true,
                        "modules":false
                      }
                    },
                    folder:this.actor.folder,
                    permission:this.actor.ownership
                  });

                  update[`system.capacites.selected.companions.crow.id`] = newActor.id;
                  break;
              }
            } else {
              if(!remplaceEnergie) update[`system.energie.malus.companions`] = 0;
              else this.actor.update({[[`system.espoir.malus.companions`]]:0});

              switch(special) {
                case 'lion':
                  const idLion = armorCapacites.companions.lion.id;
                  const actorLion = game.actors.get(idLion);

                  this._gainPE(actorLion.system.energie.value, true);

                  await actorLion.delete();
                  break;

                case 'wolf':
                  const id1Wolf = armorCapacites.companions.wolf.id.id1;
                  const id2Wolf = armorCapacites.companions.wolf.id.id2;
                  const id3Wolf = armorCapacites.companions.wolf.id.id3;
                  const actor1Wolf = game.actors.get(id1Wolf);
                  const actor2Wolf = game.actors.get(id2Wolf);
                  const actor3Wolf = game.actors.get(id3Wolf);

                  this._gainPE(actor1Wolf.system.energie.value, true);

                  await actor1Wolf.delete();
                  await actor2Wolf.delete();
                  await actor3Wolf.delete();
                  break;

                case 'crow':
                  const idCrow = armorCapacites.companions.crow.id;
                  const actorCrow = game.actors.get(idCrow);

                  this._gainPE(actorCrow.system.energie.value, true);

                  await actorCrow.delete();
                  break;
              }
            }

            armure.update(update);
            break;
          case "shrine":
            if(special === 'personnel' && value) this.actor.update({['system.equipements.armure.champDeForce.bonus.shrine']:armorCapacites.shrine.champdeforce});
            else this.actor.update({['system.equipements.armure.champDeForce.bonus.shrine']:0});

            update[`system.${toupdate}.base`] = value;
            update[`system.${toupdate}.${special}`] = value;

            armure.update(update);
            break;
          case "ghost":
            armure.update({[`system.${toupdate}.${special}`]:value});
            break;
          case "goliath":
            const eGoliath = equipcapacites.goliath;
            const aGoliath = armorCapacites.goliath;

            const goliathMetre = +eGoliath.metre;
            const bGCDF = +aGoliath.bonus.cdf.value;
            const mGRea = +aGoliath.malus.reaction.value;
            const mGDef = +aGoliath.malus.defense.value;

            update[`system.reaction.malus.goliath`] = value ? goliathMetre*mGRea : 0;
            update[`system.defense.malus.goliath`] = value ? goliathMetre*mGDef : 0;
            update[`system.equipements.armure.champDeForce.bonus.goliath`] = value ? goliathMetre*bGCDF : 0;

            this.actor.update(update);

            armure.update({[`system.${toupdate}`]:value});
            break;
          case "illumination":
            switch(special) {
              case "torch":
              case "lighthouse":
              case "lantern":
              case "blaze":
              case "beacon":
              case "projector":
                if(value) {
                  depenseEspoir = await this._depensePE(`${name} : ${game.i18n.localize(`KNIGHT.ITEMS.ARMURE.CAPACITES.ILLUMINATION.${special.toUpperCase()}.Label`)}`, espoir, true, true);

                  if(!depenseEspoir) return;
                }

                armure.update({[`system.${toupdate}.${special}`]:value});
                break;

              case "candle":
                const rCandle = new game.knight.RollKnight(dEspoir, this.actor.system);
                rCandle._success = false;
                rCandle._flavor = game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.ILLUMINATION.CANDLE.SacrificeGainEspoir");
                await rCandle.toMessage({
                  speaker: {
                  actor: this.actor?.id || null,
                  token: this.actor?.token?.id || null,
                  alias: this.actor?.name || null,
                  }
                });

                await this._depensePE(`${name} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.ILLUMINATION.CANDLE.Label")}`, rCandle.total, true, true);
                break;
            }
            break;
          case "morph":
            update[`system.${toupdate}.${special}`] = value;

            if(value) {
              const aMorph = armorCapacites.morph;
              const nbreA = equipcapacites.morph.nbre;
              const nbreP = equipcapacites.morph?.poly || 0;

              switch(special) {
                case "polymorphieLame":
                case "polymorphieGriffe":
                case "polymorphieCanon":
                  this.actor.update({[`system.equipements.armure.capacites.morph.poly`]:nbreP+1});

                  if(nbreP+1 === 2) update[`system.capacites.selected.morph.poly.fait`] = true;
                  break;
                case "vol":
                case "phase":
                case "etirement":
                case "polymorphie":
                  this.actor.update({[`system.equipements.armure.capacites.morph.nbre`]:nbreA+1});

                  if(nbreA+1 === nbreC) update[`system.capacites.selected.morph.choisi.fait`] = true;
                  break;
                case "metal":
                  const bMCDF = +aMorph.metal.bonus.champDeForce;

                  specialUpdate[`system.equipements.armure.capacites.morph.nbre`] = nbreA+1
                  specialUpdate[`system.equipements.armure.champDeForce.bonus.morph`] = bMCDF

                  this.actor.update(specialUpdate);

                  if(nbreA+1 === nbreC) update[`system.capacites.selected.morph.choisi.fait`] = true;
                  break;
                case "fluide":
                  const bMFLUI = aMorph.fluide.bonus;

                  specialUpdate[`system.equipements.armure.capacites.morph.nbre`] = nbreA+1
                  specialUpdate[`system.reaction.bonus.morph`] = +bMFLUI.reaction;
                  specialUpdate[`system.defense.bonus.morph`] = +bMFLUI.defense;

                  this.actor.update(specialUpdate);

                  if(nbreA+1 === nbreC) update[`system.capacites.selected.morph.choisi.fait`] = true;
                  break;
              }
            } else {
              if(special === 'morph') {
                specialUpdate[`system.equipements.armure.capacites.morph.nbre`] = 0;
                specialUpdate[`system.equipements.armure.capacites.morph.poly`] = 0;
                specialUpdate[`system.equipements.armure.champDeForce.bonus.morph`] = 0;
                specialUpdate[`system.reaction.armure.bonus.morph`] = 0;
                specialUpdate[`system.defense.armure.bonus.morph`] = 0;

                update[`system.${toupdate}.morph`] = false;
                update[`system.${toupdate}.polymorphieLame`] = false;
                update[`system.${toupdate}.polymorphieGriffe`] = false;
                update[`system.${toupdate}.polymorphieCanon`] = false;
                update[`system.capacites.selected.morph.poly.fait`] = false;
                update[`system.capacites.selected.morph.choisi.fait`] = false;
                update[`system.capacites.selected.morph.choisi.vol`] = false;
                update[`system.capacites.selected.morph.choisi.phase`] = false;
                update[`system.capacites.selected.morph.choisi.etirement`] = false;
                update[`system.capacites.selected.morph.choisi.metal`] = false;
                update[`system.capacites.selected.morph.choisi.fluide`] = false;
                update[`system.capacites.selected.morph.choisi.polymorphie`] = false;
                update[`system.capacites.selected.morph.choisi.polymorphieLame`] = false;
                update[`system.capacites.selected.morph.choisi.polymorphieGriffe`] = false;
                update[`system.capacites.selected.morph.choisi.polymorphieCanon`] = false;

                this.actor.update(specialUpdate);
              } else {
                const nbreP = equipcapacites.morph?.poly || 0;
                this.actor.update({[`system.equipements.armure.capacites.morph.poly`]:nbreP-1});
              }
            }

            armure.update(update);
            break;
          case "puppet":
            armure.update({[`system.${toupdate}`]:value});
            break;
          case "discord":
            armure.update({[`system.${toupdate}.${special}`]:value});
            break;
          case "rage":
            const rageInterdit = [];
            const rageBonus = [];

            switch(special){
              case "active":
                update[`system.${toupdate}.${special}`] = value;

                if(value) update[`system.${toupdate}.niveau.colere`] = true;
                else {
                  update[`system.${toupdate}.niveau.colere`] = false;
                  update[`system.${toupdate}.niveau.rage`] = false;
                  update[`system.${toupdate}.niveau.fureur`] = false;
                }

                specialUpdate[`system.egide.bonus.rage`] = value ? armorCapacites.rage.colere.egide : 0;
                specialUpdate[`system.reaction.malus.rage`] = value ? armorCapacites.rage.colere.reaction : 0;
                specialUpdate[`system.defense.malus.rage`] = value ? armorCapacites.rage.colere.defense : 0;

                if(armorCapacites.rage.colere.combosInterdits.has && value) {
                  for (let [key, combo] of Object.entries(armorCapacites.rage.colere.combosInterdits.liste)){
                    if(combo != "") {
                      rageInterdit.push(combo);
                    }
                  }
                }

                if(armorCapacites.rage.colere.combosBonus.has && value) {
                  for (let [key, combo] of Object.entries(armorCapacites.rage.colere.combosBonus.liste)){
                    if(combo != "") {
                      rageBonus.push(combo);
                    }
                  }
                }

                specialUpdate[`system.combos.interdits.caracteristiques.rage`] = value ? rageInterdit : [];
                specialUpdate[`system.combos.bonus.caracteristiques.rage`] = value ? rageBonus : [];

                this.actor.update(specialUpdate);
                armure.update(update);
                break;

              case "niveau":
                const typeNiveau = target.data("niveau") || false;
                const nActuel = armure.system.capacites.selected?.rage?.niveau || false;

                if(typeNiveau === "espoir") {
                  const rSEspoir = new game.knight.RollKnight("1D6", this.actor.system);
                  rSEspoir._success = false;
                  rSEspoir._flavor = game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.RAGE.UP.Espoir");
                  await rSEspoir.toMessage({
                    speaker: {
                    actor: this.actor?.id || null,
                    token: this.actor?.token?.id || null,
                    alias: this.actor?.name || null,
                    }
                  });

                  const rSEspoirTotal = await this._depensePE(`${name} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.RAGE.UP.Espoir")}`, rSEspoir.total, true, true);

                  if(!rSEspoirTotal) return;
                }

                if(nActuel.colere) {
                  update[`system.${toupdate}.niveau.colere`] = false;
                  update[`system.${toupdate}.niveau.rage`] = true;

                  specialUpdate[`system.egide.bonus.rage`] = armorCapacites.rage.rage.egide;
                  specialUpdate[`system.reaction.malus.rage`] = armorCapacites.rage.rage.reaction;
                  specialUpdate[`system.defense.malus.rage`] = armorCapacites.rage.rage.defense;

                  if(armorCapacites.rage.rage.combosInterdits.has) {
                    for (let [key, combo] of Object.entries(armorCapacites.rage.rage.combosInterdits.liste)){
                      if(combo != "") {
                        rageInterdit.push(combo);
                      }
                    }
                  }

                  if(armorCapacites.rage.rage.combosBonus.has) {
                    for (let [key, combo] of Object.entries(armorCapacites.rage.rage.combosBonus.liste)){
                      if(combo != "") {
                        rageBonus.push(combo);
                      }
                    }
                  }
                }
                if(nActuel.rage) {
                  update[`system.${toupdate}.niveau.colere`] = false;
                  update[`system.${toupdate}.niveau.rage`] = false;
                  update[`system.${toupdate}.niveau.fureur`] = true;

                  specialUpdate[`system.egide.bonus.rage`] = armorCapacites.rage.fureur.egide;
                  specialUpdate[`system.reaction.malus.rage`] = armorCapacites.rage.fureur.reaction;
                  specialUpdate[`system.defense.malus.rage`] = armorCapacites.rage.fureur.defense;

                  if(armorCapacites.rage.fureur.combosInterdits.has) {
                    for (let [key, combo] of Object.entries(armorCapacites.rage.fureur.combosInterdits.liste)){
                      if(combo != "") {
                        rageInterdit.push(combo);
                      }
                    }
                  }

                  if(armorCapacites.rage.fureur.combosBonus.has) {
                    for (let [key, combo] of Object.entries(armorCapacites.rage.fureur.combosBonus.liste)){
                      if(combo != "") {
                        rageBonus.push(combo);
                      }
                    }
                  }
                }

                specialUpdate[`system.combos.interdits.caracteristiques.rage`] = rageInterdit;
                specialUpdate[`system.combos.bonus.caracteristiques.rage`] = rageBonus;

                this.actor.update(specialUpdate);
                armure.update(update);
                break;

              case "degats":
                const degatsRage = target.data("dgts") || 0;
                const degatsLabel = target.data("label") || "";
                const sante = getData.data.system.sante.value;

                const rDgtsRage = new game.knight.RollKnight(degatsRage, this.actor.system);
                rDgtsRage._success = false;
                rDgtsRage._flavor = `${name} : ${degatsLabel}`;
                await rDgtsRage.toMessage({
                  speaker: {
                  actor: this.actor?.id || null,
                  token: this.actor?.token?.id || null,
                  alias: this.actor?.name || null,
                  }
                });

                this.actor.update({[`system.sante.value`]:Math.max(sante-rDgtsRage.total, 0)});
              break

              case "recuperation":
                const recuperationRage = target.data("recuperation") || 0;
                const labelRecuperationRage = target.data("labelrecuperation") || "";

                const rGEspoir = new game.knight.RollKnight(recuperationRage, this.actor.system);
                  rGEspoir._success = false;
                  rGEspoir._flavor = game.i18n.localize("KNIGHT.GAINS.Espoir") + ` (${labelRecuperationRage})`;
                  await rGEspoir.toMessage({
                    speaker: {
                    actor: this.actor?.id || null,
                    token: this.actor?.token?.id || null,
                    alias: this.actor?.name || null,
                    }
                  });

                this._gainPE(rGEspoir.total, true, true);
                break;
            }
            break;
          case "record":
            armure.update({[`system.${toupdate}`]:value});
            break;
          case "totem":
            armure.update({[`system.${toupdate}`]:value});
            break;
          case "warlord":
            const aWarlord = armorCapacites.warlord.impulsions;

            if(isAllie) update[`system.${toupdate}.${special}.allie`] = value;
            else {
              update[`system.${toupdate}.${special}.porteur`] = value;

              switch(special) {
                case "esquive":
                  specialUpdate['system.reaction.bonus.warlord'] = +aWarlord.esquive.bonus.reaction;
                  specialUpdate['system.defense.bonus.warlord'] = +aWarlord.esquive.bonus.defense;

                  this.actor.update(specialUpdate);
                  break;

                case "force":
                  this.actor.update({['system.equipements.armure.champDeForce.bonus.warlord']:+aWarlord.force.bonus.champDeForce});
                  break;
              }
            }

            armure.update(update);
            break;
          case "watchtower":
            armure.update({[`system.${toupdate}`]:value});
            break;
          case "zen":
            const autre = [].concat(caracteristiques);
            autre.shift();

            this._rollDice(name, caracteristiques[0], 5, autre, caracteristiques);
            break;
          case "nanoc":
            armure.update({[`system.${toupdate}.${special}`]:value});
            break;
          case "type":
            armure.update({[`system.${toupdate}.${special}.${variant}`]:value});
            break;
          case "mechanic":
            const mechanic = armorCapacites[capacite].reparation[special];
            const rMechanic = new game.knight.RollKnight(`${mechanic.dice}D6+${mechanic.fixe}`, this.actor.system);
            rMechanic._success = false;
            rMechanic._flavor = `${name}`;
            await rMechanic.toMessage({
              speaker: {
              actor: this.actor?.id || null,
              token: this.actor?.token?.id || null,
              alias: this.actor?.name || null,
              }
            });
            break;
        }
      }

      if(type === 'module') {
        const dataModule = this.actor.items.get(module);
        dataModule.update({[`system.active.base`]:value})

        if(dataModule.system.jetsimple.has && value) {
          const jSREffects = await getEffets(this.actor, 'contact', 'standard', {}, dataModule.system.jetsimple.effets, {raw:[], custom:[]}, {raw:[], custom:[]}, {raw:[], custom:[]}, false);
          const execJSR = new game.knight.RollKnight(dataModule.system.jetsimple.jet, this.actor.system);
          await execJSR.evaluate();

          let jSRoll = {
            flavor:dataModule.system.jetsimple.label,
            main:{
              total:execJSR._total,
              tooltip:await execJSR.getTooltip(),
              formula: execJSR._formula
            },
            other:jSREffects.other
          };

          const jSRMsgData = {
            user: game.user.id,
            speaker: {
              actor: this.actor?.id || null,
              token: this.actor?.token?.id || null,
              alias: this.actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            rolls:[execJSR].concat(listAllEffets.rollDgts),
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', jSRoll),
            sound: CONFIG.sounds.dice
          };

          const rMode = game.settings.get("core", "rollMode");
          const msgFData = ChatMessage.applyRollMode(jSRMsgData, rMode);

          await ChatMessage.create(msgFData, {
            rollMode:rMode
          });
        } else if(!value) {
          const wear = getData.data.system.wear === 'ascension' ? 'ascension' : 'armure';

          update[`system.equipements.${wear}.armure.bonus.${module}`] = 0;
          update[`system.equipements.${wear}.champDeForce.bonus.${module}`] = 0;
          update[`system.equipements.${wear}.energie.bonus.${module}`] = 0;

          this.actor.update(update);
        }
      }

      if(type === 'modulePnj') {
        const index = target.data("index");

        const dataModule = this.actor.items.get(module),
              dataPnj = dataModule.system.pnj.liste[index];

        if(value) {
          const listeAspects = dataPnj.aspects.liste;

          const system = {
            aspects:dataPnj.aspects.has ? {
              'chair':{
                'value':listeAspects.chair.value,
                'ae':{
                  'mineur':{
                    'value':listeAspects.chair.ae.mineur
                  },
                  'majeur':{
                    'value':listeAspects.chair.ae.majeur
                  }
                }
              },
              'bete':{
                'value':listeAspects.bete.value,
                'ae':{
                  'mineur':{
                    'value':listeAspects.bete.ae.mineur
                  },
                  'majeur':{
                    'value':listeAspects.bete.ae.majeur
                  }
                }
              },
              'machine':{
                'value':listeAspects.machine.value,
                'ae':{
                  'mineur':{
                    'value':listeAspects.machine.ae.mineur
                  },
                  'majeur':{
                    'value':listeAspects.machine.ae.majeur
                  }
                }
              },
              'dame':{
                'value':listeAspects.dame.value,
                'ae':{
                  'mineur':{
                    'value':listeAspects.dame.ae.mineur
                  },
                  'majeur':{
                    'value':listeAspects.dame.ae.majeur
                  }
                }
              },
              'masque':{
                'value':listeAspects.masque.value,
                'ae':{
                  'mineur':{
                    'value':listeAspects.masque.ae.mineur
                  },
                  'majeur':{
                    'value':listeAspects.masque.ae.majeur
                  }
                }
              }
            } : {},
            initiative:{
              diceBase:dataPnj.initiative.dice,
              bonus:{user:dataPnj.initiative.fixe}
            },
            armure:{
              base:dataPnj.armure,
              value:dataPnj.armure
            },
            champDeForce:{
              base:dataPnj.champDeForce
            },
            reaction:{
              base:dataPnj.reaction
            },
            defense:{
              base:dataPnj.defense
            },
            options:{
              noAspects:dataPnj.aspects.has ? false : true,
              noArmesImprovisees:dataPnj.aspects.has ? false : true,
              noCapacites:true,
              noGrenades:true,
              noNods:true,
              espoir:false,
              bouclier:false,
              sante:false,
              energie:false,
              resilience:false
            }
          };

          if(dataPnj.jetSpecial.has) {
            const jetsSpeciaux = [];

            system.options.jetsSpeciaux = true;

            for (let [key, jet] of Object.entries(dataPnj.jetSpecial.liste)) {
              jetsSpeciaux.push({
                name:jet.nom,
                value:`${jet.dice}D6+${jet.overdrive}`
              });
            }

            system.jetsSpeciaux = jetsSpeciaux;
          }

          if(dataPnj.type === 'bande') {
            system.debordement = {};
            system.debordement.value = dataPnj.debordement;
          }

          newActor = await Actor.create({
            name: `${this.title} : ${dataPnj.nom}`,
            type: dataPnj.type,
            img:dataModule.img,
            system:system,
            permission:this.actor.ownership
          });

          if(dataPnj.armes.has && dataPnj.type !== 'bande') {
            const items = [];

            for (let [key, arme] of Object.entries(dataPnj.armes.liste)) {
              const wpnType = arme.type === 'tourelle' ? 'distance' : arme.type;

              let wpn = {
                type:wpnType,
                portee:arme.portee,
                degats:{
                  dice:arme.degats.dice,
                  fixe:arme.degats.fixe
                },
                violence:{
                  dice:arme.violence.dice,
                  fixe:arme.violence.fixe
                },
                effets:{
                  raw:arme.effets.raw,
                  custom:arme.effets.custom
                }
              };

              if(arme.type === 'tourelle') {
                wpn['tourelle'] = {
                  has:true,
                  attaque:{
                    dice:arme.attaque.dice,
                    fixe:arme.attaque.fixe
                  }
                }
              }

              const nItem = {
                name:arme.nom,
                type:'arme',
                system:wpn,
                };

                items.push(nItem);
            }

            await newActor.createEmbeddedDocuments("Item", items);
          }

          this.actor.items.get(module).update({[`system`]:{
            'active':{
              'pnj':true,
              'pnjName':dataPnj.nom
            },
            'id':newActor.id
          }});

        } else if(!value) {
          const actor = game.actors.get(dataModule.system.id);

          await actor.delete();

          dataModule.update({[`system`]:{
            'active':{
              'pnj':false,
              'pnjName':''
            },
            'id':''
          }});
        }

      }
    });

    html.find('.armure .activationLegende').click(async ev => {
      const target = $(ev.currentTarget);
      const name = target.data("name");
      const toupdate = target.data("toupdate");
      const type = target.data("type");
      const capacite = target.data("capacite");
      const hasFlux = target.data("flux") || false;
      const cout = eval(target.data("cout"));
      const retrieve = +target.data('depense');
      const flux = hasFlux != false ? eval(hasFlux) : false;
      const special = target.data("special");
      const variant = target.data("variant");
      const isAllie = target.data("isallie");
      const getData = this.getData();
      const equipcapacites = getData.data.system.equipements.armure.capacites;
      const armorCapacites = getData.actor.armureLegendeData.system.capacites.selected;
      const value = target.data("value") ? false : true;
      const armure = this.actor.items.get(this._getArmorLegendeId());
      const armureBase = this.actor.items.get(this._getArmorId());
      const remplaceEnergie = armureBase.system.espoir.remplaceEnergie || false;

      if(value) {
        const depense = await this._depensePE(name, cout, true, false, flux);

        if(!depense) return;
      }

      let newActor;
      let update = {}
      let specialUpdate = {};

      switch(capacite) {
        case "changeling":
          armure.update({[`system.${toupdate}.${special}`]:value});
          break;
        case "companions":
          update[`system.${toupdate}.base`] = value;
          update[`system.${toupdate}.${special}`] = value;

          if(value) {
            if(!remplaceEnergie) update[`system.energie.malus.companions`] = retrieve;
            else this.actor.update({[[`system.espoir.malus.companions`]]:retrieve});

            switch(special) {
              case 'lion':
                const dataLion = armorCapacites.companions.lion;

                const dataLChair = dataLion.aspects.chair;
                const dataLBete = dataLion.aspects.bete;
                const dataLMachine = dataLion.aspects.machine;
                const dataLDame = dataLion.aspects.dame;
                const dataLMasque = dataLion.aspects.masque;

                const lionAEChairMin = dataLChair.ae > 4 ? 0 : dataLChair.ae;
                const lionAEChairMaj = dataLChair.ae < 5 ? 0 : dataLChair.ae;

                const lionAEBeteMin = dataLBete.ae > 4 ? 0 : dataLBete.ae;
                const lionAEBeteMaj = dataLBete.ae < 5 ? 0 : dataLBete.ae;

                const lionAEMachineMin = dataLMachine.ae > 4 ? 0 : dataLMachine.ae;
                const lionAEMachineMaj = dataLMachine.ae < 5 ? 0 : dataLMachine.ae;

                const lionAEDameMin = dataLDame.ae > 4 ? 0 : dataLDame.ae;
                const lionAEDameMaj = dataLDame.ae < 5 ? 0 : dataLDame.ae;

                const lionAEMasqueMin = dataLMasque.ae > 4 ? 0 : dataLMasque.ae;
                const lionAEMasqueMaj = dataLMasque.ae < 5 ? 0 : dataLMasque.ae;

                newActor = await Actor.create({
                  name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.LION.Label")}`,
                  type: "pnj",
                  img:dataLion.img,
                  system:{
                    "aspects": {
                      "chair":{
                        "value":dataLChair.value,
                        "ae":{
                          "mineur":{
                            "value":lionAEChairMin
                          },
                          "majeur":{
                            "value":lionAEChairMaj
                          }
                        }
                      },
                      "bete":{
                        "value":dataLBete.value,
                        "ae":{
                          "mineur":{
                            "value":lionAEBeteMin
                          },
                          "majeur":{
                            "value":lionAEBeteMaj
                          }
                        }
                      },
                      "machine":{
                        "value":dataLMachine.value,
                        "ae":{
                          "mineur":{
                            "value":lionAEMachineMin
                          },
                          "majeur":{
                            "value":lionAEMachineMaj
                          }
                        }
                      },
                      "dame":{
                        "value":dataLDame.value,
                        "ae":{
                          "mineur":{
                            "value":lionAEDameMin
                          },
                          "majeur":{
                            "value":lionAEDameMaj
                          }
                        }
                      },
                      "masque":{
                        "value":dataLMasque.value,
                        "ae":{
                          "mineur":{
                            "value":lionAEMasqueMin
                          },
                          "majeur":{
                            "value":lionAEMasqueMaj
                          }
                        }
                      }
                    },
                    "energie":{
                      "base":retrieve,
                      "value":retrieve,
                    },
                    "champDeForce":{
                      "base":dataLion.champDeForce.base,
                    },
                    "armure":{
                      "value":dataLion.armure.value,
                      "base":dataLion.armure.base
                    },
                    "initiative":{
                      "diceBase":dataLion.initiative.value,
                      "bonus":{
                        "user":dataLion.initiative.fixe,
                      }
                    },
                    "defense":{
                      "base":dataLion.defense.value
                    },
                    "reaction":{
                      "base":dataLion.reaction.value
                    },
                    "options":{
                      "resilience":false,
                      "sante":false,
                      "espoir":false,
                      "bouclier":false,
                      "noCapacites":true,
                      "modules":true
                    }
                  },
                  items:dataLion.modules,
                  permission:this.actor.ownership,
                  folder:this.actor.folder
                });

                const nLItems = [];

                const nLItem = {
                  name:dataLion.armes.contact.coups.label,
                  type:'arme',
                  system:{
                    type:'contact',
                    portee:dataLion.armes.contact.coups.portee,
                    degats:{
                      dice:dataLion.armes.contact.coups.degats.dice,
                      fixe:dataLion.armes.contact.coups.degats.fixe
                    },
                    violence:{
                      dice:dataLion.armes.contact.coups.violence.dice,
                      fixe:dataLion.armes.contact.coups.violence.fixe
                    },
                    effets:{
                      raw:dataLion.armes.contact.coups.effets.raw,
                      custom:dataLion.armes.contact.coups.effets.custom
                    }
                  }};

                nLItems.push(nLItem);

                await newActor.createEmbeddedDocuments("Item", nLItems);

                update[`system.capacites.selected.companions.lion.id`] = newActor.id
                break;

              case 'wolf':
                let newActor2;
                let newActor3;

                const dataWolf = armorCapacites.companions.wolf;

                const dataWChair = dataWolf.aspects.chair;
                const dataWBete = dataWolf.aspects.bete;
                const dataWMachine = dataWolf.aspects.machine;
                const dataWDame = dataWolf.aspects.dame;
                const dataWMasque = dataWolf.aspects.masque;

                const dataActor = {
                  "aspects": {
                    "chair":{
                      "value":dataWChair.value
                    },
                    "bete":{
                      "value":dataWBete.value
                    },
                    "machine":{
                      "value":dataWMachine.value
                    },
                    "dame":{
                      "value":dataWDame.value
                    },
                    "masque":{
                      "value":dataWMasque.value
                    }
                  },
                  "energie":{
                    "base":retrieve,
                    "value":retrieve,
                  },
                  "champDeForce":{
                    "base":dataWolf.champDeForce.base,
                  },
                  "armure":{
                    "value":dataWolf.armure.base,
                    "base":dataWolf.armure.base
                  },
                  "initiative":{
                    "diceBase":dataWolf.initiative.value,
                    "bonus":{
                      "user":dataWolf.initiative.fixe,
                    }
                  },
                  "defense":{
                    "base":dataWolf.defense.base
                  },
                  "reaction":{
                    "base":dataWolf.reaction.base
                  },
                  "wolf":dataWolf.configurations,
                  "configurationActive":'',
                  "options":{
                    "resilience":false,
                    "sante":false,
                    "espoir":false,
                    "bouclier":false,
                    "modules":false,
                    "noCapacites":true,
                    "wolfConfiguration":true
                  }
                };

                newActor = await Actor.create({
                  name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.Label")} 1`,
                  type: "pnj",
                  img:dataWolf.img,
                  system:dataActor,
                  permission:this.actor.ownership,
                  folder:this.actor.folder
                });

                newActor2 = await Actor.create({
                  name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.Label")} 2`,
                  type: "pnj",
                  img:dataWolf.img,
                  system:dataActor,
                  permission:this.actor.ownership,
                  folder:this.actor.folder
                });

                newActor3 = await Actor.create({
                  name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.Label")} 3`,
                  type: "pnj",
                  img:dataWolf.img,
                  system:dataActor,
                  permission:this.actor.ownership,
                  folder:this.actor.folder
                });

                const nWItems = [];

                const nWItem = {
                  name:dataWolf.armes.contact.coups.label,
                  type:'arme',
                  system:{
                    type:'contact',
                    portee:dataWolf.armes.contact.coups.portee,
                    degats:{
                      dice:dataWolf.armes.contact.coups.degats.dice,
                      fixe:dataWolf.armes.contact.coups.degats.fixe
                    },
                    violence:{
                      dice:dataWolf.armes.contact.coups.violence.dice,
                      fixe:dataWolf.armes.contact.coups.violence.fixe
                    },
                    effets:{
                      raw:dataWolf.armes.contact.coups.effets.raw,
                      custom:dataWolf.armes.contact.coups.effets.custom
                    }
                  }};

                nWItems.push(nWItem);

                await newActor.createEmbeddedDocuments("Item", nWItems);
                await newActor2.createEmbeddedDocuments("Item", nWItems);
                await newActor3.createEmbeddedDocuments("Item", nWItems);

                update[`system.capacites.selected.companions.wolf.id`] = {
                  id1:newActor.id,
                  id2:newActor2.id,
                  id3:newActor3.id
                };
                break;

              case 'crow':
                const dataCrow = armorCapacites.companions.crow;

                const dataCChair = dataCrow.aspects.chair;
                const dataCBete = dataCrow.aspects.bete;
                const dataCMachine = dataCrow.aspects.machine;
                const dataCDame = dataCrow.aspects.dame;
                const dataCMasque = dataCrow.aspects.masque;

                newActor = await Actor.create({
                  name: `${this.title} : ${game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.CROW.Label")}`,
                  type: "bande",
                  img:dataCrow.img,
                  system:{
                    "aspects": {
                      "chair":{
                        "value":dataCChair.value
                      },
                      "bete":{
                        "value":dataCBete.value
                      },
                      "machine":{
                        "value":dataCMachine.value
                      },
                      "dame":{
                        "value":dataCDame.value
                      },
                      "masque":{
                        "value":dataCMasque.value
                      }
                    },
                    "energie":{
                      "value":retrieve,
                      "max":retrieve,
                    },
                    "champDeForce":{
                      "base":dataCrow.champDeForce.base,
                    },
                    "sante":{
                      "value":dataCrow.cohesion.base,
                      "base":dataCrow.cohesion.base
                    },
                    "initiative":{
                      "diceBase":dataCrow.initiative.value,
                      "bonus":{
                        "user":dataCrow.initiative.fixe,
                      }
                    },
                    "defense":{
                      "base":dataCrow.defense.value
                    },
                    "reaction":{
                      "base":dataCrow.reaction.value
                    },
                    "options":{
                      "resilience":false,
                      "sante":false,
                      "espoir":false,
                      "bouclier":false,
                      "noCapacites":true,
                      "energie":true,
                      "modules":false
                    }
                  },
                  permission:this.actor.ownership,
                  folder:this.actor.folder
                });

                update[`system.capacites.selected.companions.crow.id`] = newActor.id;
                break;
            }
          }  else {
            if(!remplaceEnergie) update[`system.energie.malus.companions`] = 0;
            else this.actor.update({[[`system.espoir.malus.companions`]]:0});

            switch(special) {
              case 'lion':
                const idLion = armorCapacites.companions.lion.id;
                const actorLion = game.actors.get(idLion);

                this._gainPE(actorLion.system.energie.value, true);

                await actorLion.delete();
                break;

              case 'wolf':
                const id1Wolf = armorCapacites.companions.wolf.id.id1;
                const id2Wolf = armorCapacites.companions.wolf.id.id2;
                const id3Wolf = armorCapacites.companions.wolf.id.id3;
                const actor1Wolf = game.actors.get(id1Wolf);
                const actor2Wolf = game.actors.get(id2Wolf);
                const actor3Wolf = game.actors.get(id3Wolf);

                this._gainPE(actor1Wolf.system.energie.value, true);

                await actor1Wolf.delete();
                await actor2Wolf.delete();
                await actor3Wolf.delete();
                break;

              case 'crow':
                const idCrow = armorCapacites.companions.crow.id;
                const actorCrow = game.actors.get(idCrow);

                this._gainPE(actorCrow.system.energie.value, true);

                await actorCrow.delete();
                break;
            }
          }

          armure.update(update);
          break;
        case "shrine":
          if(special === 'personnel' && value) this.actor.update({['system.equipements.armure.champDeForce.bonus.shrine']:armorCapacites.shrine.champdeforce});
          else this.actor.update({['system.equipements.armure.champDeForce.bonus.shrine']:0});

          update[`system.${toupdate}.base`] = value;
          update[`system.${toupdate}.${special}`] = value;

          armure.update(update);
          break;
        case "ghost":
          armure.update({[`system.${toupdate}.${special}`]:value});
          break;
        case "goliath":
          const eGoliath = equipcapacites.goliath;
          const aGoliath = armorCapacites.goliath;

          const goliathMetre = +eGoliath.metre;
          const bGCDF = +aGoliath.bonus.cdf.value;
          const mGRea = +aGoliath.malus.reaction.value;
          const mGDef = +aGoliath.malus.defense.value;

          update[`system.reaction.malus.goliath`] = value ? goliathMetre*mGRea : 0;
          update[`system.defense.malus.goliath`] = value ? goliathMetre*mGDef : 0;
          update[`system.equipements.armure.champDeForce.bonus.goliath`] = value ? goliathMetre*bGCDF : 0;

          this.actor.update(update);
          armure.update({[`system.${toupdate}`]:value});
          break;
        case "puppet":
          armure.update({[`system.${toupdate}`]:value});
          break;
        case "discord":
          armure.update({[`system.${toupdate}.${special}`]:value});
          break;
        case "record":
          armure.update({[`system.${toupdate}`]:value});
          break;
        case "totem":
          armure.update({[`system.${toupdate}`]:value});
          break;
        case "warlord":
          const aWarlord = armorCapacites.warlord.impulsions;

          if(isAllie) update[`system.${toupdate}.${special}.allie`] = value;
          else {
            update[`system.${toupdate}.${special}.porteur`] = value;

            switch(special) {
              case "esquive":
                specialUpdate['system.reaction.bonus.warlord'] = +aWarlord.esquive.bonus.reaction;
                specialUpdate['system.defense.bonus.warlord'] = +aWarlord.esquive.bonus.defense;

                this.actor.update(specialUpdate);
                break;

              case "force":
                this.actor.update({['system.equipements.armure.champDeForce.bonus.warlord']:+aWarlord.force.bonus.champDeForce});
                break;
            }
          }

          armure.update(update);
          break;
        case "nanoc":
          armure.update({[`system.${toupdate}.${special}`]:value});
          break;
        case "type":
          armure.update({[`system.${toupdate}.${special}.${variant}`]:value});
          break;
        case "mechanic":
          const mechanic = armorCapacites[capacite].reparation[special];
          const rMechanic = new game.knight.RollKnight(`${mechanic.dice}D6+${mechanic.fixe}`, this.actor.system);
          rMechanic._success = false;
          rMechanic._flavor = `${name}`;
          await rMechanic.toMessage({
            speaker: {
            actor: this.actor?.id || null,
            token: this.actor?.token?.id || null,
            alias: this.actor?.name || null,
            }
          });
          break;
      }
    });

    html.find('.armure .special').click(async ev => {
      const target = $(ev.currentTarget);
      const special = target.data("special");
      const label = target.data("name");
      const value =  eval(target.data("value"));
      const note = target.data("note");
      const base = target.data("base");
      const flux = +this.getData().data.system.flux.value;
      const armure = this.actor.items.get(this._getArmorId());

      switch(special) {
        case 'recolteflux':
          const limiteHC = +armure.system.special.selected.recolteflux.horsconflit.limite;

          let total = flux+value;

          if(note === 'horsConflit' && total > limiteHC) total = limiteHC;

          this.actor.update({[`system.flux.value`]:total});
          const dataMsg = {
            flavor:label,
            main:{
              total:value
            }
          };

          const msg = {
            user: game.user.id,
            speaker: {
              actor: this.actor?.id || null,
              token: this.actor?.token?.id || null,
              alias: this.actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', dataMsg)
          };

          const rMode = game.settings.get("core", "rollMode");
          const msgFData = ChatMessage.applyRollMode(msg, rMode);

          await ChatMessage.create(msgFData, {
            rollMode:rMode
          });
          break;
        case 'contrecoups':
          this._rollDice(label, base, false, [], [], false, '', '', '', -1, 0);
          break;
      }
    });

    html.find('.armure .specialLegende').click(async ev => {
      const target = $(ev.currentTarget);
      const special = target.data("special");
      const label = target.data("name");
      const value =  eval(target.data("value"));
      const note = target.data("note");
      const flux = +this.getData().data.system.flux.value;
      const armure = this.actor.items.get(this._getArmorLegendeId());

      switch(special) {
        case 'recolteflux':
          const limiteHC = +armure.system.special.selected.recolteflux.horsconflit.limite;

          let total = flux+value;

          if(note === 'horsConflit' && total > limiteHC) total = limiteHC;

          this.actor.update({[`system.flux.value`]:total});
          const dataMsg = {
            flavor:label,
            main:{
              total:value
            }
          };

          const msg = {
            user: game.user.id,
            speaker: {
              actor: this.actor?.id || null,
              token: this.actor?.token?.id || null,
              alias: this.actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', dataMsg)
          };

          const rMode = game.settings.get("core", "rollMode");
          const msgFData = ChatMessage.applyRollMode(msg, rMode);

          await ChatMessage.create(msgFData, {
            rollMode:rMode
          });
          break;
      }
    });

    html.find('.armure .capacitesultime .activateCU').click(async ev => {
      const target = $(ev.currentTarget);
      const label = target.data("label");
      const id = target.data("id");
      const toupdate = target.data("toupdate");
      const value = target.data("value") ? false : true;
      const isinstant = target.data("isinstant");

      const actor = this.actor;
      const item = this.actor.items.get(id);
      const getData = this.getData().systemData;
      const getCUData = item.system.actives;

      const recuperation = getCUData.recuperation;
      const jet = getCUData.jet;
      const dgts = getCUData.degats;
      const viol = getCUData.violence;
      const effets = getCUData.effets;

      const update = {};

      if(value) {
        const energie = getCUData?.energie || 0;
        const heroisme = getCUData?.heroisme || 0;

        if(getData.heroisme.value-heroisme < 0) {
          const msgHeroisme = {
            flavor:`${label}`,
            main:{
              total:`${game.i18n.localize('KNIGHT.JETS.Notheroisme')}`
            }
          };

          const msgEnergieData = {
            user: game.user.id,
            speaker: {
              actor: this.actor?.id || null,
              token: this.actor?.token?.id || null,
              alias: this.actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', msgHeroisme),
            sound: CONFIG.sounds.dice
          };

          const rMode = game.settings.get("core", "rollMode");
          const msgFData = ChatMessage.applyRollMode(msgEnergieData, rMode);

          await ChatMessage.create(msgFData, {
            rollMode:rMode
          });

          return;
        }

        if(!await this._depensePE(label, energie)) return;

        if(!isinstant) item.update({[`system.${toupdate}`]:value});

        update['system.heroisme.value'] = getData.heroisme.value-heroisme;

        if(recuperation.PA) update[`system.armure.value`] = getData.armure.max;
        if(recuperation.PS) update[`system.sante.value`] = getData.sante.max;
        if(recuperation.PE) update[`system.energie.value`] = getData.energie.max;

        if(!isinstant) {
          if(getCUData.reaction > 0) update['system.reaction.bonus.capaciteultime'] = getCUData.reaction;
          if(getCUData.defense > 0) update['system.defense.bonus.capaciteultime'] = getCUData.defense;
        }

        if(jet.actif && jet.isfixe) {
          const rMode = game.settings.get("core", "rollMode");

          const jetF = new game.knight.RollKnight(`${jet.fixe.dice}D6+${jet.fixe.fixe}`, actor.system);
          jetF._success = false;
          await jetF.evaluate({async:true});

          const pJets = {
            flavor:`${label} : ${jet.fixe.label}`,
            main:{
              total:jetF._total,
              tooltip:await jetF.getTooltip(),
              formula: jetF._formula
            },
          };

          const jetMsgData = {
            user: game.user.id,
            speaker: {
              actor: actor?.id || null,
              token: actor?.token?.id || null,
              alias: actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls:[jetF],
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', pJets),
            sound: CONFIG.sounds.dice
          };

          const msgData = ChatMessage.applyRollMode(jetMsgData, rMode);

          await ChatMessage.create(msgData, {
            rollMode:rMode
          });
        }

        if(dgts.actif && dgts.isfixe) {
          const rMode = game.settings.get("core", "rollMode");

          const listEffets = await getEffets(actor, '', 'standard', {}, dgts.effets, {raw:[], custom:[]}, {raw:[], custom:[]}, {raw:[], custom:[]}, false, 0);

          const dgtsF = new game.knight.RollKnight(`${dgts.fixe.dice+listEffets.degats.totalDice}D6+${dgts.fixe.fixe+listEffets.degats.totalBonus}`, actor.system);
          dgtsF._success = false;
          await dgtsF.evaluate(listEffets.degats.minMax);

          const dgtsSubEffets = listEffets.degats.list.concat(listEffets.attack.list, listEffets.other).sort();
          const dgtsIncEffets = listEffets.degats.include.concat(listEffets.attack.include).sort();

          const pDegats = {
            flavor:`${label} : ${game.i18n.localize('KNIGHT.AUTRE.Degats')}`,
            main:{
              total:dgtsF._total,
              tooltip:await dgtsF.getTooltip(),
              formula: dgtsF._formula
            },
            sub:dgtsSubEffets,
            include:dgtsIncEffets
          };

          const dgtsMsgData = {
            user: game.user.id,
            speaker: {
              actor: actor?.id || null,
              token: actor?.token?.id || null,
              alias: actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls:[dgtsF].concat(listEffets.rollDgts),
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', pDegats),
            sound: CONFIG.sounds.dice
          };

          const msgData = ChatMessage.applyRollMode(dgtsMsgData, rMode);

          await ChatMessage.create(msgData, {
            rollMode:rMode
          });
        }

        if(viol.actif && viol.isfixe) {
          const rMode = game.settings.get("core", "rollMode");

          const listEffets = await getEffets(actor, '', 'standard', {}, viol.effets, {raw:[], custom:[]}, {raw:[], custom:[]}, {raw:[], custom:[]}, false, 0);

          const violF = new game.knight.RollKnight(`${viol.fixe.dice+listEffets.violence.totalDice}D6+${viol.fixe.fixe+listEffets.violence.totalBonus}`, actor.system);
          violF._success = false;
          await violF.evaluate(listEffets.violence.minMax);

          const violSubEffets = listEffets.violence.list.concat(listEffets.attack.list, listEffets.other).sort();
          const violIncEffets = listEffets.violence.include.concat(listEffets.attack.include).sort();

          const pViolence = {
            flavor:`${label} : ${game.i18n.localize('KNIGHT.AUTRE.Violence')}`,
            main:{
              total:violF._total,
              tooltip:await violF.getTooltip(),
              formula: violF._formula
            },
            sub:violSubEffets,
            include:violIncEffets
          };

          const violenceMsgData = {
            user: game.user.id,
            speaker: {
              actor: actor?.id || null,
              token: actor?.token?.id || null,
              alias: actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rolls:[violF].concat(listEffets.rollViol),
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', pViolence),
            sound: CONFIG.sounds.dice
          };

          const msgData = ChatMessage.applyRollMode(violenceMsgData, rMode);

          await ChatMessage.create(msgData, {
            rollMode:rMode
          });
        }

        if(effets.actif) {
          const rMode = game.settings.get("core", "rollMode");

          const listEffets = await getEffets(actor, '', 'standard', {}, effets, {raw:[], custom:[]}, {raw:[], custom:[]}, {raw:[], custom:[]}, false, 0);

          let rollSubEffets = listEffets.attack.list.concat(listEffets.attack.include,
            listEffets.other,
            listEffets.degats.include, listEffets.degats.list,
            listEffets.violence.include, listEffets.violence.list).sort();

          rollSubEffets = rollSubEffets.filter((valeur, index, tableau) => {
            return tableau.indexOf(valeur) === index;
          });

          const pRoll = {
            flavor:`${label} : ${game.i18n.localize('KNIGHT.EFFETS.Label')}`,
            main:{},
            other:rollSubEffets
          };

          const rollMsgData = {
            user: game.user.id,
            speaker: {
              actor: actor?.id || null,
              token: actor?.token?.id || null,
              alias: actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', pRoll),
            sound: CONFIG.sounds.dice
          };

          const msgData = ChatMessage.applyRollMode(rollMsgData, rMode);

          await ChatMessage.create(msgData, {
            rollMode:rMode
          });
        }

      } else {
        if(!isinstant) item.update({[`system.${toupdate}`]:value});

        update['system.reaction.bonus.capaciteultime'] = 0;
        update['system.defense.bonus.capaciteultime'] = 0;
      }

      if(Object.keys(update).length > 0) actor.update(update);
    });

    html.find('.armure .capacitesultime .rollCU').click(async ev => {
      const target = $(ev.currentTarget);
      const label = target.data("label");
      const id = target.data("id");
      const type = target.data("type");
      const nameList = target.data("rollcu");
      const paliers = target.data("paliers").split(',');
      const caracteristique = target.data("caracteristique");

      const actor = this.actor;
      const item = this.actor.items.get(id);
      const getData = this.getData().systemData;
      const getCUData = item.system.actives;

      const roll = getCUData[type];

      if(roll.actif && !roll.isfixe) {
        const selected = +html.find(`.armure .capacitesultime .${nameList}`).val();
        const energie = roll.variable.energie*(selected+1) || 0;
        const heroisme = getCUData?.heroisme || 0;

        if(getData.heroisme.value-heroisme < 0) {
          const msgHeroisme = {
            flavor:`${label}`,
            main:{
              total:`${game.i18n.localize('KNIGHT.JETS.Notheroisme')}`
            }
          };

          const msgEnergieData = {
            user: game.user.id,
            speaker: {
              actor: this.actor?.id || null,
              token: this.actor?.token?.id || null,
              alias: this.actor?.name || null,
            },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: await renderTemplate('systems/knight/templates/dices/wpn.html', msgHeroisme),
            sound: CONFIG.sounds.dice
          };

          const rMode = game.settings.get("core", "rollMode");
          const msgFData = ChatMessage.applyRollMode(msgEnergieData, rMode);

          await ChatMessage.create(msgFData, {
            rollMode:rMode
          });

          return;
        }

        if(!await this._depensePE(label, energie)) return;

        const rMode = game.settings.get("core", "rollMode");

        let paliersRoll;
        let listEffets;
        let rollDice;
        let rollFixe;
        let rollF;
        let rollSubEffets;
        let rollIncEffets;
        let pRoll;
        let rollMsgData;
        let msgData;

        switch(type) {
          case 'jet':
            await this._rollDice(label, caracteristique);
            break;
          case 'degats':
            listEffets = await getEffets(actor, '', 'standard', {}, roll.effets, {raw:[], custom:[]}, {raw:[], custom:[]}, {raw:[], custom:[]}, false, 0);

            paliersRoll = paliers[selected];
            rollDice = +paliersRoll.split('D6+')[0];
            rollFixe = +paliersRoll.split('D6+')[1];

            rollF = new game.knight.RollKnight(`${rollDice+listEffets.degats.totalDice}D6+${rollFixe+listEffets.degats.totalBonus}`, actor.system);
            rollF._success = false;
            await rollF.evaluate(listEffets.degats.minMax);

            rollSubEffets = listEffets.degats.list.concat(listEffets.attack.list, listEffets.other).sort();
            rollIncEffets = listEffets.degats.include.concat(listEffets.attack.include).sort();

            pRoll = {
              flavor:`${label} : ${game.i18n.localize('KNIGHT.AUTRE.Degats')}`,
              main:{
                total:rollF._total,
                tooltip:await rollF.getTooltip(),
                formula: rollF._formula
              },
              sub:rollSubEffets,
              include:rollIncEffets
            };

            rollMsgData = {
              user: game.user.id,
              speaker: {
                actor: actor?.id || null,
                token: actor?.token?.id || null,
                alias: actor?.name || null,
              },
              type: CONST.CHAT_MESSAGE_TYPES.ROLL,
              rolls:[rollF].concat(listEffets.rollDgts),
              content: await renderTemplate('systems/knight/templates/dices/wpn.html', pRoll),
              sound: CONFIG.sounds.dice
            };

            msgData = ChatMessage.applyRollMode(rollMsgData, rMode);

            await ChatMessage.create(msgData, {
              rollMode:rMode
            });
          break;

          case 'violence':
            listEffets = await getEffets(actor, '', 'standard', {}, roll.effets, {raw:[], custom:[]}, {raw:[], custom:[]}, {raw:[], custom:[]}, false, 0);

            paliersRoll = paliers[selected];
            rollDice = +paliersRoll.split('D6+')[0];
            rollFixe = +paliersRoll.split('D6+')[1];

            rollF = new game.knight.RollKnight(`${rollDice+listEffets.violence.totalDice}D6+${rollFixe+listEffets.violence.totalBonus}`, actor.system);
            rollF._success = false;
            await rollF.evaluate(listEffets.violence.minMax);

            rollSubEffets = listEffets.violence.list.concat(listEffets.attack.list, listEffets.other).sort();
            rollIncEffets = listEffets.violence.include.concat(listEffets.attack.include).sort();

            pRoll = {
              flavor:`${label} : ${game.i18n.localize('KNIGHT.AUTRE.Degats')}`,
              main:{
                total:rollF._total,
                tooltip:await rollF.getTooltip(),
                formula: rollF._formula
              },
              sub:rollSubEffets,
              include:rollIncEffets
            };

            rollMsgData = {
              user: game.user.id,
              speaker: {
                actor: actor?.id || null,
                token: actor?.token?.id || null,
                alias: actor?.name || null,
              },
              type: CONST.CHAT_MESSAGE_TYPES.ROLL,
              rolls:[rollF].concat(listEffets.rollViol),
              content: await renderTemplate('systems/knight/templates/dices/wpn.html', pRoll),
              sound: CONFIG.sounds.dice
            };

            msgData = ChatMessage.applyRollMode(rollMsgData, rMode);

            await ChatMessage.create(msgData, {
              rollMode:rMode
            });
          break;
        }
      }
    });

    html.find('.armure .capacitesultime .majAscension').click(async ev => {
      const target = $(ev.currentTarget);
      const id = target.data("id");
      const permanent = target.data("permanent");
      const prestige = target.data("prestige");
      const context = this.getData();

      const armure = context.items.find(items => items.type === 'armure');
      const exist = Array.from(game.actors).find(actors => actors.system.proprietaire === this.actor.id);

      if(exist === undefined && permanent) {
        let data = context.data.system;
        data.wear = "armure";
        data.isAscension = true;
        data.proprietaire = this.actor._id;

        let items = context.items;
        let ascension = items.find(items => items.type === 'armure');
        ascension.system.permanent = true;
        ascension.system.jauges.sante = false;
        ascension.system.jauges.espoir = false;
        ascension.system.jauges.heroisme = false;

        const newItems = prestige ? items : items.filter(items => items.system.rarete !== 'prestige');

        await Actor.create({
          name: `${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.ASCENSION.Label')} : ${this.actor.name}`,
          type: "knight",
          img:armure.img,
          items:newItems,
          system:data,
          permission:this.actor.ownership
        });
      } else if(permanent) {
        let data = context.data.system;
        data.wear = "armure";
        data.isAscension = true;
        data.proprietaire = this.actor._id;

        let items = context.items;
        let ascension = items.find(items => items.type === 'armure');
        ascension.system.permanent = true;
        ascension.system.jauges.sante = false;
        ascension.system.jauges.espoir = false;
        ascension.system.jauges.heroisme = false;

        const newItems = prestige ? items : items.filter(items => items.system.rarete !== 'prestige');

        const update = {
          ['img']:armure.img,
          ['items']:newItems,
          ['system']:data
        };

        exist.update(update);
      }
    });

    html.find('.armure .supplementaire').click(async ev => {
      const cout = eval($(ev.currentTarget).data("cout"));

      await this._depensePE('', cout, true, false);
    });

    html.find('.armure .prolonger').click(async ev => {
      const type = $(ev.currentTarget).data("type");
      const capacite = $(ev.currentTarget).data("capacite");
      const name = $(ev.currentTarget).data("name");
      const hasFlux = $(ev.currentTarget).data("flux") || false;
      const special = $(ev.currentTarget).data("special");
      const id = $(ev.currentTarget).data("id");
      const cout = eval($(ev.currentTarget).data("cout"));
      const flux = hasFlux != false ? eval(hasFlux) : false;
      const espoir = $(ev.currentTarget).data("espoir");

      await this._depensePE(name, cout, true, false, flux);

      switch(capacite) {
        case "illumination":
          switch(special) {
            case "torch":
            case "lighthouse":
            case "lantern":
            case "blaze":
            case "beacon":
            case "projector":
              await this._depensePE(`${name} : ${game.i18n.localize(`KNIGHT.ITEMS.ARMURE.CAPACITES.ILLUMINATION.${special.toUpperCase()}.Label`)}`, espoir, true, true);
              break;
          }
          break;
      }
    });

    html.find('.armure .configurationWolf').click(ev => {
      const target = $(ev.currentTarget);
      const configuration = target.data("configuration");
      const armure = this.actor.items.get(this._getArmorId());
      const armorCapacites = armure.system.capacites.selected.companions;
      const detailsConfigurations = armorCapacites.wolf.configurations;
      const idWolf = armorCapacites.wolf.id;

      const actor1Wolf = game.actors.get(idWolf.id1);
      const actor2Wolf = game.actors.get(idWolf.id2);
      const actor3Wolf = game.actors.get(idWolf.id3);

      const wolf1Energie = +actor1Wolf.system.energie.value;
      const wolf2Energie = +actor2Wolf.system.energie.value;
      const wolf3Energie = +actor3Wolf.system.energie.value;
      const depenseEnergie = +detailsConfigurations[configuration].energie;


      if(wolf1Energie-depenseEnergie >= 0) {
        actor1Wolf.update({[`system`]:{
          'energie':{
            'value':wolf1Energie-depenseEnergie
          },
          'configurationActive':configuration
        }});
      }

      if(wolf2Energie-depenseEnergie >= 0) {
        actor2Wolf.update({[`system`]:{
          'energie':{
            'value':wolf2Energie-depenseEnergie
          },
          'configurationActive':configuration
        }});
      }

      if(wolf3Energie-depenseEnergie >= 0) {
        actor3Wolf.update({[`system`]:{
          'energie':{
            'value':wolf3Energie-depenseEnergie
          },
          'configurationActive':configuration
        }});
      }
    });

    html.find('.armure input.update').change(async ev => {
      const capacite = $(ev.currentTarget).data("capacite");
      const newV = $(ev.currentTarget).val();
      const oldV = $(ev.currentTarget).data("old");
      const cout = $(ev.currentTarget).data("cout");
      const flux = $(ev.currentTarget).data("flux") || false;

      const update = {
        system:{
          equipements:{
            armure:{
              champDeForce:{
                bonus:{}
              }
            }
          },
          reaction:{
            malus:{}
          },
          defense:{
            malus:{}
          }
        }
      };

      switch(capacite) {
        case "goliath":
          const aGoliath = armorCapacites.goliath;

          const bGCDF = +aGoliath.bonus.cdf.value;
          const mGRea = +aGoliath.malus.reaction.value;
          const mGDef = +aGoliath.malus.defense.value;

          update.system.equipements.armure.champDeForce.bonus.goliath = newV*bGCDF;
          update.system.reaction.malus.goliath = newV*mGRea;
          update.system.defense.malus.goliath = newV*mGDef;

          this.actor.update(update);

          if(newV > oldV) { await this._depensePE('', cout*(newV-oldV), true, false, flux); }
          break;
        case "puppet":
        case "totem":
        case "warlord":
          if(newV > oldV) { await this._depensePE('', cout*(newV-oldV), true, false, flux); }
          break;
      }
    });

    html.find('.armure .aChoisir').click(async ev => {
      const type = $(ev.currentTarget).data("type");
      const capacite = $(ev.currentTarget).data("capacite");
      const special = $(ev.currentTarget).data("special");
      const value = $(ev.currentTarget).data("value");

      const idLegende = this._getArmorLegendeId();
      const armure = this.actor.items.get(this._getArmorId());
      const armureLegende = this.actor.items?.get(idLegende) || false;

      let result = true;
      if(value === true) { result = false; }

      let update = {
        system:{
          equipements:{
            armure:{
              [type]:{
                [capacite]:{
                  choix:{
                    [special]:result
                  }
                }
              }
            }
          }
        }
      };

      let itemUpdate;

      if(capacite === 'warlordLegende') {
        itemUpdate =  {
          system:{
            capacites:{
              selected:{
                ['warlord']:{}
              }
            }
          }
        };
      } else if(capacite === 'typeLegende') {
        itemUpdate = {
          system:{
            capacites:{
              selected:{
                ['type']:{}
              }
            }
          }
        };
      } else {
        itemUpdate = {
          system:{
            capacites:{
              selected:{
                [capacite]:{}
              }
            }
          }
        };
      }


      let calcul;

      switch(capacite) {
        case "illumination":
          const illumination = armure.system.capacites.selected[capacite];
          const illuminationSelectionne = illumination.selectionne || 0;
          calcul = illuminationSelectionne;

          if(result == true) {
            calcul += 1;
          } else {
            calcul -= 1;

            if(calcul < 0) { calcul = 0; }
          }

          itemUpdate.system.capacites.selected[capacite].selectionne = calcul;
          itemUpdate.system.capacites.selected[capacite][special] = {};
          itemUpdate.system.capacites.selected[capacite][special].selectionne = result;

          armure.update(itemUpdate);
          break;
        case "type":
          const type = armure.system.capacites.selected[capacite];
          const typeSelectionne = type.selectionne || 0;
          calcul = typeSelectionne;

          if(result == true) {
            calcul += 1;
          } else {
            calcul -= 1;

            if(calcul < 0) { calcul = 0; }
          }

          itemUpdate.system.capacites.selected[capacite].selectionne = calcul;
          itemUpdate.system.capacites.selected[capacite].type = {};
          itemUpdate.system.capacites.selected[capacite].type[special] = {};
          itemUpdate.system.capacites.selected[capacite].type[special].selectionne = result;

          armure.update(itemUpdate);
          break;
        case "typeLegende":
          const typeLegende = armureLegende.system.capacites.selected['type'];
          const typeLegendeSelectionne = typeLegende.selectionne || 0;
          calcul = typeLegendeSelectionne;

          if(result == true) {
            calcul += 1;
          } else {
            calcul -= 1;

            if(calcul < 0) { calcul = 0; }
          }

          itemUpdate.system.capacites.selected['type'].selectionne = calcul;
          itemUpdate.system.capacites.selected['type'].type = {};
          itemUpdate.system.capacites.selected['type'].type[special] = {};
          itemUpdate.system.capacites.selected['type'].type[special].selectionne = result;

          armureLegende.update(itemUpdate);
          break;
        case "warlord":
          const warlord = armure.system.capacites.selected[capacite];
          const warlordSelectionne = warlord.impulsions.selectionne || 0;
          calcul = warlordSelectionne;

          if(result == true) {
            calcul += 1;
          } else {
            calcul -= 1;

            if(calcul < 0) { calcul = 0; }
          }

          itemUpdate.system.capacites.selected[capacite].impulsions = {};
          itemUpdate.system.capacites.selected[capacite].impulsions.selectionne = calcul;

          itemUpdate.system.capacites.selected[capacite].impulsions[special] = {};
          itemUpdate.system.capacites.selected[capacite].impulsions[special].choisi = result;

          armure.update(itemUpdate);
          break;
        case "warlordLegende":
          const warlordLegende = armureLegende.system.capacites.selected['warlord'];
          const warlordLegendeSelectionne = warlordLegende.impulsions.selectionne || 0;
          calcul = warlordLegendeSelectionne;

          if(result == true) {
            calcul += 1;
          } else {
            calcul -= 1;

            if(calcul < 0) { calcul = 0; }
          }

          itemUpdate.system.capacites.selected['warlord'] = {};
          itemUpdate.system.capacites.selected['warlord'].impulsions = {};
          itemUpdate.system.capacites.selected['warlord'].impulsions.selectionne = calcul;

          itemUpdate.system.capacites.selected['warlord'].impulsions[special] = {};
          itemUpdate.system.capacites.selected['warlord'].impulsions[special].choisi = result;

          armureLegende.update(itemUpdate);
          break;
        case "companions":
            const companions = armureLegende.system.capacites.selected[capacite];
            const nbreChoix = companions.nbreChoix;
            const isLionSelected = companions.lion.choisi;
            const isWolfSelected = companions.wolf.choisi;
            const isCrowSelected = companions.crow.choisi;
            let choixActuel = 0;

            if(isLionSelected || (special === 'lion' && result === true)) choixActuel += 1;
            if(isWolfSelected || (special === 'wolf' && result === true)) choixActuel += 1;
            if(isCrowSelected || (special === 'crow' && result === true)) choixActuel += 1;

            if(nbreChoix === choixActuel) itemUpdate.system.capacites.selected[capacite].choixFaits = true;

            itemUpdate.system.capacites.selected[capacite][special] = {};
            itemUpdate.system.capacites.selected[capacite][special].choisi = result;

            armureLegende.update(itemUpdate);
          break;
      }
    });

    html.find('.armure .degats').click(async ev => {
      const target = $(ev.currentTarget);
      const label = target.data("label");
      const degatsD = target.data("degats");
      const degatsF = target?.data("degatsfixe") || 0;
      const cout = target?.data("cout") || false;

      if(cout !== false) {
        const tCout = eval(cout);
        const depense = await this._depensePE(label, tCout, true, false);

        if(!depense) return;
      }

      const rDegats = new game.knight.RollKnight(`${degatsD}D6+${degatsF}`, this.actor.system);
      rDegats._flavor = `${label} : ${game.i18n.localize("KNIGHT.AUTRE.Degats")}`;
      rDegats._success = false;
      await rDegats.toMessage({
        speaker: {
        actor: this.actor?.id || null,
        token: this.actor?.token?.id || null,
        alias: this.actor?.name || null,
        }
      });
    });

    html.find('.armure .violence').click(async ev => {
      const target = $(ev.currentTarget);
      const label = target.data("label");
      const violenceD = target.data("violence");
      const violenceF = target?.data("violencefixe") || 0;
      const cout = target?.data("cout") || false;

      if(cout !== false) {
        const tCout = eval(cout);
        const depense = await this._depensePE(label, tCout, true, false);

        if(!depense) return;
      }

      const rViolence = new game.knight.RollKnight(`${violenceD}D6+${violenceF}`, this.actor.system);
      rViolence._flavor = `${label} : ${game.i18n.localize("KNIGHT.AUTRE.Violence")}`;
      rViolence._success = false;
      await rViolence.toMessage({
        speaker: {
        actor: this.actor?.id || null,
        token: this.actor?.token?.id || null,
        alias: this.actor?.name || null,
        }
      });
    });

    html.find('img.dice').hover(ev => {
      $(ev.currentTarget).attr("src", "systems/knight/assets/icons/D6White.svg");
    }, ev => {
      $(ev.currentTarget).attr("src", "systems/knight/assets/icons/D6Black.svg");
    });

    html.find('img.diceTarget').hover(ev => {
      $(ev.currentTarget).attr("src", "systems/knight/assets/icons/D6TargetWhite.svg");
    }, ev => {
      $(ev.currentTarget).attr("src", "systems/knight/assets/icons/D6TargetBlack.svg");
    });

    html.find('div.listeAspects div.line').hover(ev => {
      $(ev.currentTarget).children('img').attr("src", "systems/knight/assets/icons/D6White.svg");
    }, ev => {
      $(ev.currentTarget).children('img').attr("src", "systems/knight/assets/icons/D6Black.svg");
    });

    html.find('div.styleCombat > span.info').hover(ev => {
      html.find('div.styleCombat > span.hideInfo').css("display", "block");
    }, ev => {
      html.find('div.styleCombat > span.hideInfo').css("display", "none");
    });

    html.find('div.styleCombat > span.info').click(ev => {
      const actuel = this.getData().data.system.combat?.styleDeploy || false;

      let result = false;

      if(actuel) {
        result = false;
      } else {
        result = true;
      }

      const update = {
        system: {
          combat: {
            styleDeploy:result
          }
        }
      };

      this.actor.update(update);
    });

    html.find('div.styleCombat > select').change(async ev => {
      const style = $(ev.currentTarget).val();
      const mods = getModStyle(style);
      const data = this.getData();

      const update = {
        system: {
          reaction: {
            bonus:{
              other:mods.bonus.reaction
            },
            malus:{
              other:mods.malus.reaction
            }
          },
          defense: {
            bonus:{
              other:mods.bonus.defense
            },
            malus:{
              other:mods.malus.defense
            }
          },
          combat:{
            data:{
              tourspasses:1,
              type:"degats"
            }
          }
        }
      };

      this.actor.update(update);

      // ON ACTUALISE ROLL UI S'IL EST OUVERT
      let rollUi = Object.values(ui.windows).find((app) => app instanceof KnightRollDialog) ?? false;

      if(rollUi !== false) {
        await rollUi.setStyle({
          fulllabel:game.i18n.localize(`KNIGHT.COMBAT.STYLES.${style.toUpperCase()}.FullLabel`),
          label:game.i18n.localize(`KNIGHT.COMBAT.STYLES.${style.toUpperCase()}.Label`),
          raw:style,
          info:data.systemData.combat.styleInfo,
          caracteristiques:mods.caracteristiques,
          tourspasses:data.data.system.combat.data.tourspasses,
          type:data.data.system.combat.data.type,
          sacrifice:data.data.system.combat.data.sacrifice,
          maximum:6
        });
      }
    });

    html.find('.roll').click(ev => {
      const target = $(ev.currentTarget);
      const label = target?.data("label") || '';
      const noOd = target?.data("nood") || false;
      const caracteristique = target.data("caracteristique") || '';
      const caracAdd = target.data("caracadd") === undefined ? [] : target.data("caracadd").split(',')
      const caracLock = target.data("caraclock") === undefined ? [] : target.data("caraclock").split(',');
      const reussites = +target.data("reussitebonus") || 0;

      this._rollDice(label, caracteristique, false, caracAdd, caracLock, false, '', '', '', -1, reussites, noOd);
    });

    html.find('.rollRecuperationArt').click(async ev => {
      const target = $(ev.currentTarget);
      const value = target.data("value");

      const rEspoir = new game.knight.RollKnight(`${value}`, this.actor.system);
      rEspoir._flavor = game.i18n.localize("KNIGHT.ART.RecuperationEspoir");
      rEspoir._success = false;
      await rEspoir.toMessage({
        speaker: {
        actor: this.actor?.id || null,
        token: this.actor?.token?.id || null,
        alias: this.actor?.name || null,
        }
      });
    });

    html.find('.art-say').click(async ev => {
      const target = $(ev.currentTarget);
      const type = target.data("type");
      const name = game.i18n.localize(`KNIGHT.ART.PRATIQUE.${type.charAt(0).toUpperCase()+type.substr(1)}`);
      const data = this.getData().actor.art.system.pratique[type];

      const msg = {
        user: game.user.id,
        speaker: {
          actor: this.actor?.id || null,
          token: this.actor?.token?.id || null,
          alias: this.actor?.name || null,
        },
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: `<span style="display:flex;width:100%;font-weight:bold;">${name}</span><span style="display:flex;width:100%;text-align:justify;justify-content:left;word-break:break-all;">${data}</span>`
      };

      const rMode = game.settings.get("core", "rollMode");
      const msgFData = ChatMessage.applyRollMode(msg, rMode);

      await ChatMessage.create(msgFData, {
        rollMode:rMode
      });
    });

    html.find('.jetEspoir').click(ev => {
      this._rollDice(game.i18n.localize('KNIGHT.JETS.JetEspoir'), 'hargne', false, ['sangFroid'], ['hargne', 'sangFroid']);
    });

    html.find('.jetWpn').click(ev => {
      const target = $(ev.currentTarget);
      const name = target.data("name");
      const id = target.data("id");
      const isDistance = target.data("isdistance");
      const num = target.data("num");
      const caracs = target?.data("caracteristiques")?.split(",") || [];

      let label;

      switch(isDistance) {
        case 'grenades':
          label = `${game.i18n.localize(`KNIGHT.COMBAT.GRENADES.Singulier`)} ${game.i18n.localize(`KNIGHT.COMBAT.GRENADES.${name.charAt(0).toUpperCase()+name.substr(1)}`)}`;
          break;

        case 'longbow':
          label = game.i18n.localize(`KNIGHT.ITEMS.ARMURE.CAPACITES.LONGBOW.Label`);
          break;

        case 'armesimprovisees':
          label = game.i18n.localize(CONFIG.KNIGHT.armesimprovisees[name][num]);
          break;

        default:
          label = name;
          break;
      }

      this._rollDice(label, '', false, caracs, [], true, id, name, isDistance, num, 0);
    });

    html.find('.jetEgide').click(async ev => {
      const value = $(ev.currentTarget).data("value");

      const rEgide = new game.knight.RollKnight(value, this.actor.system);
      rEgide._flavor = game.i18n.localize("KNIGHT.JETS.JetEgide");
      rEgide._success = true;
      await rEgide.toMessage({
        speaker: {
        actor: this.actor?.id || null,
        token: this.actor?.token?.id || null,
        alias: this.actor?.name || null,
        }
      });
    });

    html.find('.motivationAccomplie').click(async ev => {
      const espoir = this.getData().data.system.espoir;
      const mods = espoir.recuperation.bonus-espoir.recuperation.malus;

      const rEspoir = new game.knight.RollKnight(`1D6+${mods}`, this.actor.system);
      rEspoir._flavor = game.i18n.localize("KNIGHT.PERSONNAGE.MotivationAccomplie");
      rEspoir._success = false;
      await rEspoir.toMessage({
        speaker: {
        actor: this.actor?.id || null,
        token: this.actor?.token?.id || null,
        alias: this.actor?.name || null,
        }
      });

      const total = rEspoir.total < 0 ? 0 : rEspoir.total;

      this._gainPE(total, true, true);
    });

    html.find('img.edit').click(ev => {
      const aspect = $(ev.currentTarget).data("aspect");
      const label = game.i18n.localize(CONFIG.KNIGHT.aspects[aspect]);

      const dataAspect = this.getData().data.system.aspects[aspect];

      let editCarac = ``;
      let listCarac = [];

      for (let [key, carac] of Object.entries(dataAspect.caracteristiques)){
        editCarac += `
        <label class="line">
            <span class="label">${carac.label}</span>
            <input type="number" class="${key}" data-type="caracteristique" value="${carac.base}" min="0" max="9" />
        </label>
        `;
        listCarac.push(key);
      }

      const editDialog = `
      <input type="number" class="aspect" data-type="aspect" value="${dataAspect.base}" min="0" max="9" />
      <div class="main">${editCarac}</div>
      `;

      const edit = new game.knight.applications.KnightEditDialog({
        title: this.actor.name+" : "+label,
        actor:this.actor.id,
        content: editDialog,
        buttons: {
          button1: {
            label: game.i18n.localize("KNIGHT.AUTRE.Valider"),
            callback: async (html) => {
              const baseAspect = +html.find('.aspect').val();

              let caracteristiques = {};

              for(let i = 0;i < listCarac.length;i++) {
                const baseCarac = +html.find(`.${listCarac[i]}`).val();

                caracteristiques[listCarac[i]] = {};
                caracteristiques[listCarac[i]].base = baseCarac;
              }

              let update = {
                system:{
                  aspects:{
                    [aspect]:{
                      base:baseAspect,
                      caracteristiques
                    }
                  }
                }
              };

              this.actor.update(update);
            },
            icon: `<i class="fas fa-check"></i>`
          },
          button2: {
            label: game.i18n.localize("KNIGHT.AUTRE.Annuler"),
            icon: `<i class="fas fa-times"></i>`
          }
        }
      }).render(true);
    });

    html.find('button.gainEspoirItem').click(ev => {
      const id = $(ev.currentTarget).data("id");
      const item = this.actor.items.get(id);
      const value = item.data.data.gainEspoir.value;
      const actuel = this.getData().data.system.espoir.value;
      const max = this.getData().data.system.espoir.max;
      let total = actuel+value;

      const updateItem = {
        system:{
          gainEspoir:{
            applique:true
          }
        }
      };

      if(total > max) { total = max; }

      const updateActor = {
        system:{
          espoir:{
            value:total
          }
        }
      };

      item.update(updateItem);
      this.actor.update(updateActor);
    });

    html.find('div.buttonSelectArmure button.armure').click(ev => {
      const type = $(ev.currentTarget).data("type");
      const data = this.object.system;
      let armure = 0;

      switch(type) {
        case 'armure':
          armure = +this.actor.items.get(data.equipements.armure.id).system.armure.value;
          break;

        case 'ascension':
        case 'guardian':
          armure = +data.equipements[type].armure.value;
          break;
      }

      const update = {
        system:{
          wear:type,
          armure:{
            value:armure
          }
        }
      };

      if(type != 'armure') {
        this._resetArmureCapacites();
      }

      this.actor.update(update);
    });

    html.find('div.nods img.dice').click(async ev => {
      const data = this.getData();
      const target = $(ev.currentTarget);
      const nbre = +target.data("number");
      const nods = target.data("nods");

      if(nbre > 0) {
        const recuperation = data.data.system.combat.nods[nods].recuperationBonus;
        const bonus = recuperation.length > 0 ? recuperation.join(' + ') : ` 0`;

        const rNods = new game.knight.RollKnight(`3D6+${bonus}`, this.actor.system);
        rNods._flavor = game.i18n.localize(`KNIGHT.JETS.Nods${nods}`);
        rNods._success = false;
        await rNods.toMessage({
          speaker: {
          actor: this.actor?.id || null,
          token: this.actor?.token?.id || null,
          alias: this.actor?.name || null,
          }
        });

        let base = 0;
        let max = 0;
        let type = '';

        switch(nods) {
          case 'soin':
            type = 'sante';
            base = data.data.system.sante.value;
            max = data.data.system.sante.max;

            break;

          case 'energie':
            type = 'energie';
            base = data.data.system.energie.value;
            max = data.data.system.energie.max;
            break;

          case 'armure':
            type = 'armure'
            base = data.data.system.armure.value;
            max = data.data.system.armure.max;
            break;
        }

        const total = rNods.total;
        const final = base+total > max ? max : base+total;

        const update = {
          'system':{
            'combat':{
              'nods':{
                [nods]:{
                  'value':nbre - 1
                }
              }
            },
            [type]:{
              'value':final
            }
          }
        };

        if(type === 'armure') {
          this._updatePA(final);
        }

        this.actor.update(update);
      }
    });

    html.find('div.nods img.diceTarget').click(async ev => {
      const data = this.getData();
      const target = $(ev.currentTarget);
      const nbre = +target.data("number");
      const nods = target.data("nods");

      if(nbre > 0) {
        const recuperation = data.data.system.combat.nods[nods].recuperationBonus;
        const bonus = recuperation.length > 0 ? recuperation.join(' + ') : ` 0`;

        const rNods = new game.knight.RollKnight(`3D6+${bonus}`, this.actor.system);
        rNods._flavor = game.i18n.localize(`KNIGHT.JETS.Nods${nods}`);
        rNods._success = false;
        await rNods.toMessage({
          speaker: {
          actor: this.actor?.id || null,
          token: this.actor?.token?.id || null,
          alias: this.actor?.name || null,
          }
        });

        const update = {
          'system':{
            'combat':{
              'nods':{
                [nods]:{
                  'value':nbre - 1
                }
              }
            }
          }
        };

        this.actor.update(update);
      }
    });

    html.find('div.combat div.wpn a.item-equip').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      const update = {
        system:{
          equipped:true,
          rack:false
        }
      }

      item.update(update);
    });

    html.find('div.combat div.wpn a.item-unequip').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      const update = {
        system:{
          equipped:false,
          rack:true
        }
      }

      item.update(update);
    });

    html.find('div.combat div.wpn a.item-rack').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      const update = {
        system:{
          equipped:false,
          rack:true
        }
      }

      item.update(update);
    });

    html.find('div.combat div.wpn a.item-unrack').click(ev => {
      const header = $(ev.currentTarget).parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));

      const update = {
        system:{
          equipped:false,
          rack:false
        }
      }

      item.update(update);
    });

    html.find('div.armure div.capacites img.info').click(ev => {
      const span = $(ev.currentTarget).siblings("span.hideInfo")
      const width = $(ev.currentTarget).parents("div.mainData").width() / 2;
      const isW50 = $(ev.currentTarget).parents("div.data").width();
      let position = "";
      let borderRadius = "border-top-right-radius";

      if(isW50 <= width) {
        if($(ev.currentTarget).parents("div.data").position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      } else {
        if($(ev.currentTarget).parent().position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      }

      span.width($(html).width()/2).css(position, "0px").css(borderRadius, "0px").toggle("display");
      $(ev.currentTarget).toggleClass("clicked");
    });

    html.find('div.armure div.special img.info').click(ev => {
      const span = $(ev.currentTarget).siblings("span.hideInfo")
      const width = $(ev.currentTarget).parents("div.mainData").width() / 2;
      const isW50 = $(ev.currentTarget).parents("div.data").width();
      let position = "";
      let borderRadius = "border-top-right-radius";

      if(isW50 <= width) {
        if($(ev.currentTarget).parents("div.data").position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      } else {
        if($(ev.currentTarget).parent().position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      }

      span.width($(html).width()/2).css(position, "0px").css(borderRadius, "0px").toggle("display");
      $(ev.currentTarget).toggleClass("clicked");
    });

    html.find('div.armure div.bModule img.info').click(ev => {
      const span = $(ev.currentTarget).siblings("span.hideInfo")
      const width = $(ev.currentTarget).parents("div.mainBlock").width() / 2;
      const isW50 = $(ev.currentTarget).parents("div.data").width();
      let position = "";
      let borderRadius = "border-top-right-radius";

      if(isW50 <= width) {
        if($(ev.currentTarget).parents("div.data").position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      } else {
        if($(ev.currentTarget).parent().position().left > width) {
          position = "right";
          borderRadius = "border-top-right-radius";
        } else {
          position = "left";
          borderRadius = "border-top-left-radius";
        }
      }

      span.width($(html).width()/2).css(position, "0px").css(borderRadius, "0px").toggle("display");
      $(ev.currentTarget).toggleClass("clicked");
    });

    html.find('div.options button').click(ev => {
      const target = $(ev.currentTarget);
      const value = target.data("value");
      const option = target.data("option");
      let update = {};

      if(option === 'resettype') {
        update[`system.capacites.selected.type.type.herald.-=selectionne`] = null;
        update[`system.capacites.selected.type.type.hunter.-=selectionne`] = null;
        update[`system.capacites.selected.type.type.scholar.-=selectionne`] = null;
        update[`system.capacites.selected.type.type.scout.-=selectionne`] = null;
        update[`system.capacites.selected.type.type.soldier.-=selectionne`] = null;
        update[`system.capacites.selected.type.selectionne`] = 0;

        this.actor.items.get(this._getArmorId()).update(update);
      } else if(option === 'resetwarlord') {
        update[`system.capacites.selected.warlord.impulsions.action.choisi`] = false;
        update[`system.capacites.selected.warlord.impulsions.energie.choisi`] = false;
        update[`system.capacites.selected.warlord.impulsions.esquive.choisi`] = false;
        update[`system.capacites.selected.warlord.impulsions.force.choisi`] = false;
        update[`system.capacites.selected.warlord.impulsions.guerre.choisi`] = false;
        update[`system.capacites.selected.warlord.impulsions.selectionne`] = 0;

        this.actor.items.get(this._getArmorId()).update(update);
      } else {
        const result = value === true ? false : true;

        this.actor.update({[`system.options.${option}`]:result});
      }
    });

    html.find('div.progression .tableauPG button').click(ev => {
      const target = $(ev.currentTarget);
      const value = target.data("value");
      const id = target.data("id");
      const evo = target.data("evo");
      const isLongbow = target?.data("longbow") || false;
      const result = value ? false : true;

      if(isLongbow) {
        this.actor.items.get(id).update({[`system.evolutions.special.longbow.${evo}.gratuit`]:result});
      } else {
        this.actor.items.get(id).update({['system.gratuit']:result});
      }
    });

    html.find('div.progression .tableauPG .gloire-create').click(ev => {
      const dataGloire = this.getData().data.system.progression.gloire;
      const gloireListe = dataGloire.depense.liste;
      let addOrder =  gloireListe.length === 0 ? 0 : Math.max(...gloireListe.map(o => o.order));
      const gloireAutre = dataGloire.depense?.autre || {};
      let gloireAutreLength = gloireAutre.length;

      const newData = [];

      if(isNaN(addOrder)) {
        addOrder = Object.keys(gloireListe).length;
      }

      if(isNaN(gloireAutreLength)) {
        gloireAutreLength = Object.keys(gloireAutre).length;
      }

      for(let i = 0;i < gloireAutreLength;i++) {
        newData.push(gloireAutre[i]);
      }

      newData.push({
        order:addOrder+1,
        nom:'',
        cout:0,
        gratuit:false
      });

      this.actor.update({[`system.progression.gloire.depense.autre`]:newData});
    });

    html.find('div.progression .tableauPG .gloire-delete').click(ev => {
      const target = $(ev.currentTarget);
      const id = +target.data("id");

      this.actor.update({[`system.progression.gloire.depense.autre.-=${id}`]:null});
    });

    html.find('div.progression .tableauPX .experience-create').click(ev => {
      const getData = this.getData();
      const data = getData.systemData.progression.experience.depense.liste
      const length = data.length === undefined ? Object.keys(data).length : data.length;

      const newData = [];

      for(let i = 0;i < length;i++) {
        newData.push(data[i]);
      }

      newData.push({
        addOrder:length+1,
        caracteristique:'',
        bonus:0,
        cout:0
      });

      this.actor.update({[`system.progression.experience.depense.liste`]:newData});
    });

    html.find('div.progression .tableauPX .experience-delete').click(ev => {
      const target = $(ev.currentTarget);
      const id = +target.data("id");
      const getData = this.getData();
      const data = getData.systemData.progression.experience.depense.liste
      const length = data.length === undefined ? Object.keys(data).length : data.length;

      const newData = [];

      for(let i = 0;i < length;i++) {
        if(i !== id) {
          newData.push(data[i]);
        }
      }

      this.actor.update({[`system.progression.experience.depense.liste`]:newData});
    });

    html.find('.appliquer-evolution-armure').click(ev => {
      const target = $(ev.currentTarget);
      const id = target.data("num");
      const dataArmor = this.actor.items.get(this._getArmorId());
      const listEvolutions = dataArmor.system.evolutions.liste;
      const dataEArmor = listEvolutions[id].data;
      const capacites = listEvolutions[id].capacites;
      let special = listEvolutions[id].special;
      const gloireListe = this.getData().data.system.progression.gloire.depense.liste;
      const addOrder =  gloireListe.length === 0 ? 0 : Math.max(...gloireListe.map(o => o.order));
      const filter = [];

      dataArmor.update({[`system.archivage.liste.${listEvolutions[id].value}`]:dataArmor.system});

      for (let [key, spec] of Object.entries(special)) {
        const hasDelete = spec?.delete || false;

        if(hasDelete !== false) {
          if(hasDelete.value === true) {
            dataArmor.update({[`system.special.selected.-=${key}`]:null});
            filter.push(key);
            delete special[key];
          }
        }
      }

      dataArmor.update({['system']:{
        armure:{
          base:dataArmor.system.armure.base+dataEArmor.armure
        },
        champDeForce:{
          base:dataArmor.system.champDeForce.base+dataEArmor.champDeForce
        },
        energie:{
          base:dataArmor.system.energie.base+dataEArmor.energie
        },
        espoir:{
          value:dataArmor.system.espoir.value+dataEArmor.espoir
        },
        capacites:{
          selected:capacites
        },
        special:{
          selected:special
        },
        evolutions:{
          liste:{
            [id]:{
              applied:true,
              addOrder:addOrder+1
            }
          }
        }
      }});

      for (let [key, evolutions] of Object.entries(listEvolutions)) {
        const num = +key;

        if(num > id) {
          for(let i = 0;i < filter.length;i++) {
            const hasSpecial = evolutions.special?.[filter[i]] || false;

            if(hasSpecial !== false) {
              dataArmor.update({[`system.evolutions.liste.${num}.special.-=${filter[i]}`]:null});
            }
          }
        }
      }
    });

    html.find('.appliquer-evolution-companions').click(ev => {
      const dataCompanions = this.actor.armureData.system.capacites.selected.companions;
      const dataWolfConfig = dataCompanions.wolf.configurations;
      let data = this.actor.armureData.system.evolutions.special.companions.evolutions;
      data['aspects'] = {
        "lion":{
          "chair":{
            "value":0,
            "ae":0
          },
          "bete":{
            "value":0,
            "ae":0
          },
          "machine":{
            "value":0,
            "ae":0
          },
          "dame":{
            "value":0,
            "ae":0
          },
          "masque":{
            "value":0,
            "ae":0
          }
        },
        "wolf":{
          "chair":{
            "value":0,
            "ae":0
          },
          "bete":{
            "value":0,
            "ae":0
          },
          "machine":{
            "value":0,
            "ae":0
          },
          "dame":{
            "value":0,
            "ae":0
          },
          "masque":{
            "value":0,
            "ae":0
          }
        },
        "crow":{
          "chair":{
            "value":0,
            "ae":0
          },
          "bete":{
            "value":0,
            "ae":0
          },
          "machine":{
            "value":0,
            "ae":0
          },
          "dame":{
            "value":0,
            "ae":0
          },
          "masque":{
            "value":0,
            "ae":0
          }
        }
      };

      data['configurations'] = {
        'labor':{
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.LABOR.Label"),
          value:0
        },
        'medic':{
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.MEDIC.Label"),
          value:0
        },
        'tech':{
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.TECH.Label"),
          value:0
        },
        'fighter':{
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.FIGHTER.Label"),
          value:0
        },
        'recon':{
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.RECON.Label"),
          value:0
        },
      };

      if(dataWolfConfig.labor.niveau < 3) {
        data['configurations']['labor'] = {
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.LABOR.Label"),
          value:0
        }
      }

      if(dataWolfConfig.medic.niveau < 3) {
        data['configurations']['medic'] = {
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.MEDIC.Label"),
          value:0
        }
      }

      if(dataWolfConfig.tech.niveau < 3) {
        data['configurations']['tech'] = {
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.TECH.Label"),
          value:0
        }
      }

      if(dataWolfConfig.fighter.niveau < 3) {
        data['configurations']['fighter'] = {
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.FIGHTER.Label"),
          value:0
        }
      }

      if(dataWolfConfig.recon.niveau < 3) {
        data['configurations']['recon'] = {
          label:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.WOLF.CONFIGURATIONS.RECON.Label"),
          value:0
        }
      }

      data['lion']['aspects'].restant = data.lion.aspects.value;
      data['lion'].restant = data.lion.ae;

      data['wolf']['aspects'].restant = data.wolf.aspects.value;
      data['wolf'].restant = data.wolf.ae;
      data['wolf'].bonusRestant = data.wolf.bonus;

      data['crow']['aspects'].restant = data.crow.aspects.value;

      const companions = new game.knight.applications.KnightCompanionsDialog({
        title: this.actor.name+" : "+game.i18n.localize("KNIGHT.ITEMS.ARMURE.EVOLUTIONS.EvolutionCompanion"),
        actor:this.actor.id,
        content:{
          data,
          selected:{
            lion:false,
            wolf:false,
            crow:false
          }
        },
        buttons: {
          button1: {
            label: game.i18n.localize("KNIGHT.AUTRE.Valider"),
            icon: `<i class="fas fa-check"></i>`,
            validate:true
          },
          button2: {
            label: game.i18n.localize("KNIGHT.AUTRE.Annuler"),
            icon: `<i class="fas fa-times"></i>`,
            validate:false
          }
        }
      }).render(true);
    });

    html.find('.acheter-evolution-longbow').click(ev => {
      const target = $(ev.currentTarget);
      const id = +target.data("id");
      const value = +target.data("value");
      const dataArmor = this.actor.items.get(this._getArmorId());
      const listEvolutions = dataArmor.system.evolutions.special.longbow;
      const capacites = listEvolutions[id];
      const dataGloire = this.getData().data.system.progression.gloire;
      const gloireActuel = +dataGloire.actuel;
      const gloireListe = dataGloire.depense.liste;
      const addOrder =  gloireListe.length === 0 ? 0 : Math.max(...gloireListe.map(o => o.order));



      if(gloireActuel >= value) {
        let array = {
          description:capacites.description,
          value:value,
          data:dataArmor.system.capacites.selected.longbow,
          addOrder:addOrder+1};

        dataArmor.update({[`system.archivage.longbow.${id}`]:array});

        const update = {};

        delete capacites.description;
        update['system'] = {
          capacites:{
            selected:{
              longbow:capacites
            }
          },
          evolutions:{
            special:{
              longbow:{
                [id]:{
                  applied:true,
                  addOrder:addOrder+1
                }
              }
            }
          }
        };

        dataArmor.update(update);

        this.actor.update({['system.progression.gloire.actuel']:gloireActuel-value});
      }
    });

    html.find('div.rollback a.retour').click(ev => {
      const target = $(ev.currentTarget);
      const index = target.data("value");
      const type = target.data("type");
      const getArmor = this.actor.items.get(this._getArmorId());
      const dataArchives = type === 'liste' ? Object.entries(getArmor.system.archivage[type]) : getArmor.system.archivage[type];
      const getArchives = dataArchives[index];

      let update = {};

      if(type === 'liste') {
        const listEvolutions = getArchives[1].evolutions.liste;

        for (let [key, evolutions] of Object.entries(listEvolutions)) {
          const num = +key;

          if(num >= index) {
            listEvolutions[key].applied = false;
          }
        }

        update['system'] = getArchives[1];

        for (let [key, archive] of Object.entries(dataArchives)) {
          const num = +key;

          if(num >= index) {
            update[`system.archivage.${type}.-=${archive[0]}`] = null;
          }
        }

        getArmor.update(update);
      } else if(type === 'longbow') {
        const listEvolutions = getArmor.system.evolutions.special.longbow;
        const getPG = +this.actor.system.progression.gloire.actuel;
        let gloire = 0;

        for (let [key, evolutions] of Object.entries(listEvolutions)) {
          const num = +key;

          if(evolutions.addOrder >= getArchives.addOrder && evolutions.addOrder !== undefined) {
            update[`system.evolutions.special.longbow.${num}.applied`] = false;
            update[`system.archivage.${type}.-=${num}`] = null;
            gloire += evolutions.value;
          }
        }

        update['system.capacites.selected.longbow'] = getArchives.data;
        getArmor.update(update);
        this.actor.update({["system.progression.gloire.actuel"]:gloire+getPG});
      }
    });

    html.find('a.avdvshow').click(ev => {
      const target = $(ev.currentTarget);
      const header = target.parents(".summary");
      const item = this.actor.items.get(header.data("item-id"));
      const value = target.data('value') ? false : true;

      item.update({['system.show']:value});
    });
  }

  /* -------------------------------------------- */
  async _onItemCreate(event) {
    event.preventDefault();
    const gloireListe = this.getData().data.system.progression.gloire.depense.liste;
    const gloireMax = gloireListe.length === 0 ? 0 : Math.max(...gloireListe.map(o => o.order));
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `${game.i18n.localize(`ITEM.Type${type.capitalize()}`)}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };

    switch(type) {
      case "arme":
          itemData.img = "systems/knight/assets/icons/arme.svg";
          break;

      case "armure":
          itemData.img = "systems/knight/assets/icons/armure.svg";
          break;

      case "avantage":
          itemData.img = "systems/knight/assets/icons/avantage.svg";
          break;

      case "inconvenient":
          itemData.img = "systems/knight/assets/icons/inconvenient.svg";
          break;

      case "motivationMineure":
          itemData.img = "systems/knight/assets/icons/motivationMineure.svg";
          break;

      case "langue":
          itemData.img = "systems/knight/assets/icons/langue.svg";
          break;

      case "contact":
          itemData.img = "systems/knight/assets/icons/contact.svg";
          break;

      case "blessure":
          itemData.img = "systems/knight/assets/icons/blessureGrave.svg";
          break;

      case "trauma":
          itemData.img = "systems/knight/assets/icons/trauma.svg";
          break;

      case "module":
          itemData.img = "systems/knight/assets/icons/module.svg";
          break;

      case "capacite":
          itemData.img = "systems/knight/assets/icons/capacite.svg";
          break;

      case "armurelegende":
          itemData.img = "systems/knight/assets/icons/armureLegende.svg";
          break;

      case "carteheroique":
          itemData.img = "systems/knight/assets/icons/carteheroique.svg";
          break;

      case "capaciteheroique":
          itemData.img = "systems/knight/assets/icons/capaciteheroique.svg";
          break;

      case "capaciteultime":
          itemData.img = "systems/knight/assets/icons/capaciteultime.svg";
          break;

      case "art":
          itemData.img = "systems/knight/assets/icons/art.svg";
          break;
    }

    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];
    const hasCapaciteCompanions = data.actor?.armureData?.system?.capacites?.selected?.companions || false;

    if (type === 'arme') {
      itemData.system = {
        type:header.dataset.subtype,
        tourelle:{
          has:header.dataset.tourelle
        },
        addOrder:gloireMax+1
      };
      delete itemData.system["subtype"];
    }

    if (type === 'avantage' || type === 'inconvenient') {
      const subtype = header.dataset?.subtype || "standard";

      itemData.system = {
        type:subtype
      };
      delete itemData.system["subtype"];
    }

    if(type === 'module' && hasCapaciteCompanions) {
      const hasArmure = actorData.equipements.armure.hasArmor;

      if(!hasArmure) return;

      const askContent = await renderTemplate("systems/knight/templates/dialog/ask-sheet.html", {what:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.LION.Ajoutermodule")});
      const askDialogOptions = {classes: ["dialog", "knight", "askdialog"]};

      await new Dialog({
        title: game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.LION.Modulelion'),
        content: askContent,
        buttons: {
          button1: {
            label: game.i18n.localize('KNIGHT.AUTRE.Oui'),
            callback: async () => {
              itemData.system = {
                isLion:true
              };

              const create = await Item.create(itemData, {parent: this.actor});

              return create;
            },
            icon: `<i class="fas fa-check"></i>`
          },
          button2: {
            label: game.i18n.localize('KNIGHT.AUTRE.Non'),
            callback: async () => {
              itemData.system.addOrder = gloireMax+1;

              const create = await Item.create(itemData, {parent: this.actor});

              return create;
            },
            icon: `<i class="fas fa-times"></i>`
          }
        }
      }, askDialogOptions).render(true);
    } else {
      if(type === 'module') {
        itemData.system.addOrder = gloireMax+1;
      }

      const create = await Item.create(itemData, {parent: this.actor});
      const id = create._id;

      if (type === 'armure') {
        const update = {
          system:{
            equipements:{
              armure:{
                id:id,
                hasArmor:true
              }
            }
          }
        };

        this.actor.update(update);
      }

      return create;
    }
  }

  async _onDropItem(event, data) {
    if ( !this.actor.isOwner ) return false;
    const item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if($(event.target).parents('div.wpnTourelle').length > 0) {
      if(itemData.type === 'arme' && itemData.system.type === 'distance') itemData.system.tourelle.has = true;

    }

    // Handle item sorting within the same Actor
    if ( this.actor.uuid === item.parent?.uuid ) return this._onSortItem(event, itemData);

    // Create the owned item
    return this._onDropItemCreate(itemData);
  }

  async _onDropItemCreate(itemData) {
    const data = this.getData()
    const actorData = data.data.system;
    const hasCapaciteCompanions = data.actor?.armureData?.system?.capacites?.selected?.companions || false;
    const gloireListe = actorData.progression.gloire.depense.liste;
    const gloireMax = gloireListe.length === 0 ? 0 : Math.max(...gloireListe.map(o => o.order));
    const hasArmor = actorData.equipements.armure?.hasArmor || false;

    itemData = itemData instanceof Array ? itemData : [itemData];
    const itemBaseType = itemData[0].type;

    if(itemBaseType === 'capacite' ||
    itemBaseType === 'effet') return;

    if(itemBaseType === 'capaciteultime') {
      for (let i of data.items) {
        if(i.type === 'capaciteultime') this.actor.items.get(i._id).delete();
      }
    }

    if(itemBaseType === 'module' && hasCapaciteCompanions) {
      const hasArmure = actorData.equipements.armure.hasArmor;

      if(!hasArmure) return;

      const askContent = await renderTemplate("systems/knight/templates/dialog/ask-sheet.html", {what:game.i18n.localize("KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.LION.Ajoutermodule")});
      const askDialogOptions = {classes: ["dialog", "knight", "askdialog"]};

      await new Dialog({
        title: game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.COMPANIONS.LION.Modulelion'),
        content: askContent,
        buttons: {
          button1: {
            label: game.i18n.localize('KNIGHT.AUTRE.Oui'),
            callback: async () => {
              itemData[0].system.isLion = true;

              const itemCreate = await this.actor.createEmbeddedDocuments("Item", itemData);

              return itemCreate;
            },
            icon: `<i class="fas fa-check"></i>`
          },
          button2: {
            label: game.i18n.localize('KNIGHT.AUTRE.Non'),
            callback: async () => {
              const itemSlots = itemData[0].system.slots;
              const armorSlots = this._getSlotsValue();

              const sTete = armorSlots.tete-itemSlots.tete;
              const sTorse = armorSlots.torse-itemSlots.torse;
              const sBrasGauche = armorSlots.brasGauche-itemSlots.brasGauche;
              const sBrasDroit = armorSlots.brasDroit-itemSlots.brasDroit;
              const sJambeGauche = armorSlots.jambeGauche-itemSlots.jambeGauche;
              const sJambeDroite = armorSlots.jambeDroite-itemSlots.jambeDroite;


              if(sTete < 0 || sTorse < 0 || sBrasGauche < 0 || sBrasDroit < 0 || sJambeGauche < 0 || sJambeDroite < 0) return;

              itemData[0].system.addOrder = gloireMax+1;

              const itemCreate = await this.actor.createEmbeddedDocuments("Item", itemData);

              return itemCreate;
            },
            icon: `<i class="fas fa-times"></i>`
          }
        }
      }, askDialogOptions).render(true);
    } else if(itemBaseType === 'module') {
      const itemSlots = itemData[0].system.slots;
      const armorSlots = this._getSlotsValue();

      const sTete = armorSlots.tete-itemSlots.tete;
      const sTorse = armorSlots.torse-itemSlots.torse;
      const sBrasGauche = armorSlots.brasGauche-itemSlots.brasGauche;
      const sBrasDroit = armorSlots.brasDroit-itemSlots.brasDroit;
      const sJambeGauche = armorSlots.jambeGauche-itemSlots.jambeGauche;
      const sJambeDroite = armorSlots.jambeDroite-itemSlots.jambeDroite;


      if(sTete < 0 || sTorse < 0 || sBrasGauche < 0 || sBrasDroit < 0 || sJambeGauche < 0 || sJambeDroite < 0) return;

      itemData[0].system.addOrder = gloireMax+1;

      const itemCreate = await this.actor.createEmbeddedDocuments("Item", itemData);

      return itemCreate;
    } else if(itemBaseType === 'arme') {
      const isRangedWpn = itemData[0].system.type;

      if(isRangedWpn === 'distance') {
        const cantHaveRangedWpn = actorData.restrictions.noArmeDistance;

        if(cantHaveRangedWpn) return;
      }

      itemData[0].system.addOrder = gloireMax+1;

      const itemCreate = await this.actor.createEmbeddedDocuments("Item", itemData);

      return itemCreate;

    } else {

      if(itemBaseType === 'armurelegende' && !hasArmor) return;

      const itemCreate = await this.actor.createEmbeddedDocuments("Item", itemData);

      const itemType = itemCreate[0].type;
      const itemId = itemCreate[0].id;

      if (itemType === 'armure') {
        this._resetArmure();

        const wear = actorData.wear;

        if(wear === 'armure') {
          this.actor.update({['system.wear']:'guardian'});
        }

        const oldArmorId = actorData.equipements.armure?.id || 0;
        if (oldArmorId !== 0) {
          const oldArmor = this.actor.items.get(oldArmorId);

          oldArmor.delete();
        }

        const update = {
          system:{
            equipements:{
              armure:{}
            }
          }
        };

        update.system.equipements.armure.id = itemId;
        update.system.equipements.armure.hasArmor = true;

        this.actor.update(update);
      }

      if (itemType === 'armurelegende') {
        const oldArmorLegendeId = this._getArmorLegendeId();

        if(oldArmorLegendeId !== 0) {
          const oldArmorLegende = this.actor.items.get(oldArmorLegendeId);

          oldArmorLegende.delete();
        }

        const update = {
          system:{
            equipements:{
              armure:{}
            }
          }
        };

        update.system.equipements.armure.idLegende = itemId;
        update.system.equipements.armure.hasArmorLegende = true;

        this.actor.update(update);
      }

      const oldArtId = actorData?.art || 0;

      if (itemType === 'art') {
        const update = {
          system:{
            art:itemId
          }
        };

        if(oldArtId !== 0) {
          const oldArt = this.actor.items?.get(oldArtId) || false;
          if(oldArt !== false) oldArt.delete();
        }

        this.actor.update(update);
      }

      return itemCreate;
    }
  }

  async _onDropActor(event, data) {
    if ( !this.actor.isOwner ) return false;

    const cls = getDocumentClass(data?.type);
    const document = await cls.fromDropData(data);
    const type = document.type;

    if(type === 'ia') {
      const update = {};

      update['system.equipements.ia.code'] = document.system.code;
      update['system.equipements.ia.surnom'] = document.name;
      update['system.equipements.ia.caractere'] = document.system.caractere;

      const itemsActuels = this.actor.items;
      for (let i of itemsActuels) {
        if(i.type === 'avantage' || i.type === 'inconvenient') {
          if(i.system.type === 'ia') {
            i.delete();
          }
        }
      };

      const items = document.items;

      for (let i of items) {
        await this._onDropItemCreate(i);
      };

      this.actor.update(update);
    }
  }

  /** @inheritdoc */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;

    /**
     * A hook event that fires when some useful data is dropped onto an ActorSheet.
     * @function dropActorSheetData
     * @memberof hookEvents
     * @param {Actor} actor      The Actor
     * @param {ActorSheet} sheet The ActorSheet application
     * @param {object} data      The data that has been dropped onto the sheet
     */
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if ( allowed === false ) return;

    // Handle different data types
    switch ( data.type ) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

  async _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;
    const system = sheetData.data.system;
    const items = sheetData.items;
    const eqpData = system.equipements;
    const armorData = eqpData.armure;
    const wear = system.wear;

    const armorSpecial = getSpecial(this.actor);
    const armorSpecialRaw = armorSpecial?.raw || [];
    const armorSpecialCustom = armorSpecial?.custom || [];
    const depenseXP = system.progression.experience.depense.liste;
    const depensePGAutre = system.progression.gloire.depense?.autre || {};

    const avantage = [];
    const inconvenient = [];
    const avantageIA = [];
    const inconvenientIA = [];
    const motivationMineure = [];
    const langue = [];
    const contact = [];
    const blessures = [];
    const trauma = [];
    const module = [];
    const modulepassifs = [];
    const moduleErsatz = {};
    const moduleBonusDgts = {
      "contact":[],
      "distance":[]
    };
    const moduleBonusDgtsVariable = {
      "contact":[],
      "distance":[]
    };
    const moduleBonusViolence = {
      "contact":[],
      "distance":[]
    };
    const moduleBonusViolenceVariable = {
      "contact":[],
      "distance":[]
    };
    const armesContactEquipee = [];
    const armesDistanceEquipee = [];
    const armesContactRack = [];
    const armesDistanceRack = [];
    const armesContactArmoury = [];
    const armesDistanceArmoury = [];
    const armesTourelles = [];
    const aspectsUpdate = {};
    const depensePG = [];
    const evolutionsAchetables = [];
    const evolutionsCompanions = [];
    const evolutionsAAcheter = [];

    const carteHeroique = [];
    const capaciteHeroique = [];
    const distinctions = [];

    const capaciteultime = items.find(items => items.type === 'capaciteultime');

    let armureData = {};
    let armureLegendeData = {};
    let longbow = {};
    let art = {};
    let aspects = {
      "chair":{
        "bonus":0,
        "malus":0,
        "caracteristiques":{
          "deplacement": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "force": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "endurance": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          }
        }
      },
      "bete":{
        "bonus":0,
        "malus":0,
        "caracteristiques":{
          "hargne": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "combat": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "instinct": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          }
        }
      },
      "machine":{
        "bonus":0,
        "malus":0,
        "caracteristiques":{
          "tir": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "savoir": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "technique": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          }
        }
      },
      "dame":{
        "bonus":0,
        "malus":0,
        "caracteristiques":{
          "aura": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "parole": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "sangFroid": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          }
        }
      },
      "masque":{
        "bonus":0,
        "malus":0,
        "caracteristiques":{
          "discretion": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "dexterite": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          },
          "perception": {
            "bonus":0,
            "malus":0,
            "overdrive": {
              "base":0,
              "bonus":0,
              "malus":0
            }
          }
        }
      }
    };
    let sante = {
      bonus:{
        avantages:[0]
      },
      malus:{
        desavantages:[0]
      },
    };
    let espoir = {
      aucun:false,
      perte:{
        saufAgonie:false,
        saufCapacite:false
      },
      bonus:{
        avantages:[0],
        armure:[0]
      },
      malus:{
        desavantages:[0],
        blessures:[0]
      },
      recuperationBonus:[0],
      recuperationMalus:[0],
      perteMalus:[0],
      value:sheetData.data.system.espoir.value
    };
    let initiative = {
      bonus:{
        avantages:[0]
      },
      malus:{
        desavantages:[0]
      },
      diceBonus:{
        avantages:[0]
      },
      diceMalus:{
        desavantages:[0]
      }
    };
    let armure = {
      bonus:{
        modules:[0]
      }
    };
    let champDeForce = {
      bonus:{
        modules:[0],
        armes:0
      }
    };
    let energie = {
      bonus:{
        modules:[0]
      }
    };
    let slots = {
      tete:0,
      torse:0,
      brasGauche:0,
      brasDroit:0,
      jambeGauche:0,
      jambeDroite:0
    };
    let grenades = {
      "antiblindage": {
        "degats": {
          "dice": 3
        },
        "violence": {
          "dice": 3
        },
        "effets":{
          "liste":[],
          "raw":[
            "destructeur",
            "dispersion 6",
            "penetrant 6",
            "percearmure 20"
          ],
          "custom":[]
        }
      },
      "explosive": {
        "degats": {
          "dice": 3
        },
        "violence": {
          "dice": 3
        },
        "effets":{
          "liste":[],
          "raw":[
            "antivehicule",
            "choc 1",
            "dispersion 3"
          ],
          "custom":[]
        }
      },
      "shrapnel": {
        "degats": {
          "dice":3
        },
        "violence": {
          "dice":3
        },
        "effets":{
          "liste":[],
          "raw":[
            "dispersion 6",
            "meurtrier",
            "ultraviolence"
          ],
          "custom":[]
        }
      },
      "flashbang": {
        "effets":{
          "liste":[],
          "raw":[
            "aucundegatsviolence",
            "barrage 2",
            "choc 1",
            "dispersion 6"
          ],
          "custom":[]
        }
      },
      "iem": {
        "effets":{
          "liste":[],
          "raw":[
            "aucundegatsviolence",
            "dispersion 6",
            "parasitage 2"
          ],
          "custom":[]
        }
      },
    };
    let nods = {
      "soin":{
        "recuperationBonus":[]
      },
      "armure":{
        "recuperationBonus":[]
      },
      "energie":{
        "recuperationBonus":[]
      }
    };
    let reaction = {
      bonus:0,
      malus:0
    };
    let defense = {
      bonus:0,
      malus:0
    };
    let egide = {
      bonus:{
        armure:[0],
        distinction:[0]
      },
      malus:{
        armure:[0]
      }
    }
    let lion = {
      armure:{
        bonus:[0],
        malus:[0]
      },
      champDeForce:{
        bonus:[0],
        malus:[0]
      },
      defense:{
        bonus:[0],
        malus:[0]
      },
      reaction:{
        bonus:[0],
        malus:[0]
      },
      energie:{
        bonus:[0],
        malus:[0]
      },
      initiative:{
        bonus:[0],
        malus:[0]
      },
      armes:{
        contact:[],
        distance:[]
      },
      modules:[],
      bonusDgtsVariable:{
        "contact":[],
        "distance":[]
      },
      bonusViolenceVariable:{
        "contact":[],
        "distance":[]
      },
      bonusDgts:{
        "contact":[],
        "distance":[]
      },
      bonusViolence:{
        "contact":[],
        "distance":[]
      }
    };
    let bonusDiceEmbuscadeSubis = 0;
    let bonusFixeEmbuscadeSubis = 0;

    for (let i of items) {
      const data = i.system;
      const bonus = data.bonus;
      const malus = data.malus;
      const limitations = data.limitations;

      // ARMURE.
      if (i.type === 'armure') {
        let passiveUltime = undefined;

        if(capaciteultime !== undefined) {
          const dataCapaciteUltime = capaciteultime.system;

          if(dataCapaciteUltime.type == 'passive') passiveUltime = dataCapaciteUltime.passives;
        }

        armorData.label = i.name;

        espoir.bonus.armure.push(i.system.espoir.value);
        egide.bonus.armure.push(i.system.egide.value);

        const armorCapacites = i.system.capacites.selected;
        const armorSpecial = i.system.special.selected;
        const armorEvolutions = i.system.evolutions;

        for (let [key, capacite] of Object.entries(armorCapacites)) {
          switch(key) {
            case "ascension":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.ascension.actif) {
                  i.system.capacites.selected[key] = Object.assign(i.system.capacites.selected[key], {
                    permanent:passiveUltime.capacites.ascension.update.permanent,
                    prestige:passiveUltime.capacites.ascension.update.prestige,
                  });
                }
              }

              const ascEnergie = armorData.capacites.ascension.energie;

              if(ascEnergie < capacite.energie.min) {
                armorData.capacites.ascension.energie = capacite.energie.min;
              } else if(ascEnergie > capacite.energie.max) {
                armorData.capacites.ascension.energie = capacite.energie.max;
              }
            break;

            case "cea":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.cea.actif) {
                  i.system.capacites.selected[key] = Object.assign(i.system.capacites.selected[key], {
                    vague:{
                      degats:{
                        dice:passiveUltime.capacites.cea.update.vague.degats.dice,
                        fixe:passiveUltime.capacites.cea.update.vague.degats.fixe,
                      },
                      violence:{
                        dice:passiveUltime.capacites.cea.update.vague.violence.dice,
                        fixe:passiveUltime.capacites.cea.update.vague.violence.fixe,
                      },
                      effets:{
                        raw:passiveUltime.capacites.cea.update.vague.effets.raw,
                        custom:passiveUltime.capacites.cea.update.vague.effets.custom,
                      }
                    },
                    rayon:{
                      degats:{
                        dice:passiveUltime.capacites.cea.update.rayon.degats.dice,
                        fixe:passiveUltime.capacites.cea.update.rayon.degats.fixe,
                      },
                      violence:{
                        dice:passiveUltime.capacites.cea.update.rayon.violence.dice,
                        fixe:passiveUltime.capacites.cea.update.rayon.violence.fixe,
                      },
                      effets:{
                        raw:passiveUltime.capacites.cea.update.rayon.effets.raw,
                        custom:passiveUltime.capacites.cea.update.rayon.effets.custom,
                      }
                    },
                    salve:{
                      degats:{
                        dice:passiveUltime.capacites.cea.update.salve.degats.dice,
                        fixe:passiveUltime.capacites.cea.update.salve.degats.fixe,
                      },
                      violence:{
                        dice:passiveUltime.capacites.cea.update.salve.violence.dice,
                        fixe:passiveUltime.capacites.cea.update.salve.violence.fixe,
                      },
                      effets:{
                        raw:passiveUltime.capacites.cea.update.salve.effets.raw,
                        custom:passiveUltime.capacites.cea.update.salve.effets.custom,
                      }
                    }
                  });
                }
              }

              if(wear === 'armure') {
                const vagueEffets = capacite.vague.effets;
                const vagueEffetsRaw = vagueEffets.raw.concat(armorSpecialRaw);
                const vagueEffetsCustom = vagueEffets.custom.concat(armorSpecialCustom) || [];
                const vagueEffetsFinal = {
                  raw:[...new Set(vagueEffetsRaw)],
                  custom:vagueEffetsCustom,
                  liste:[]
                };

                const salveEffets = capacite.salve.effets;
                const salveEffetsRaw = salveEffets.raw.concat(armorSpecialRaw);
                const salveEffetsCustom = salveEffets.custom.concat(armorSpecialCustom) || [];
                const salveEffetsFinal = {
                  raw:[...new Set(salveEffetsRaw)],
                  custom:salveEffetsCustom,
                  liste:[]
                };

                const rayonEffets = capacite.rayon.effets;
                const rayonEffetsRaw = rayonEffets.raw.concat(armorSpecialRaw);
                const rayonEffetsCustom = rayonEffets.custom.concat(armorSpecialCustom) || [];
                const rayonEffetsFinal = {
                  raw:[...new Set(rayonEffetsRaw)],
                  custom:rayonEffetsCustom,
                  liste:[]
                };

                const vagueWpnC = {
                  _id:i._id,
                  name:game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.CEA.VAGUE.Label'),
                  system:{
                    capaciteName:'cea',
                    subCapaciteName:'vague',
                    noRack:true,
                    capacite:true,
                    portee:capacite.vague.portee,
                    energie:capacite.energie,
                    espoir:capacite.espoir,
                    degats:{
                      dice:capacite.vague.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.vague.violence.dice,
                      fixe:0
                    },
                    type:'contact',
                    effets:vagueEffetsFinal
                  }
                };

                const salveWpnC = {
                  _id:i._id,
                  name:game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.CEA.SALVE.Label'),
                  system:{
                    capaciteName:'cea',
                    subCapaciteName:'salve',
                    noRack:true,
                    capacite:true,
                    portee:capacite.salve.portee,
                    energie:capacite.energie,
                    espoir:capacite.espoir,
                    degats:{
                      dice:capacite.salve.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.salve.violence.dice,
                      fixe:0
                    },
                    type:'contact',
                    effets:salveEffetsFinal
                  }
                };

                const rayonWpnC = {
                  _id:i._id,
                  name:game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.CEA.RAYON.Label'),
                  system:{
                    capaciteName:'cea',
                    subCapaciteName:'rayon',
                    noRack:true,
                    capacite:true,
                    portee:capacite.rayon.portee,
                    energie:capacite.energie,
                    espoir:capacite.espoir,
                    degats:{
                      dice:capacite.rayon.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.rayon.violence.dice,
                      fixe:0
                    },
                    type:'contact',
                    effets:rayonEffetsFinal
                  }
                };

                const vagueWpnD = {
                  _id:i._id,
                  name:game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.CEA.VAGUE.Label'),
                  system:{
                    capaciteName:'cea',
                    subCapaciteName:'vague',
                    noRack:true,
                    capacite:true,
                    portee:capacite.vague.portee,
                    energie:capacite.energie,
                    espoir:capacite.espoir,
                    degats:{
                      dice:capacite.vague.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.vague.violence.dice,
                      fixe:0
                    },
                    type:'distance',
                    effets:vagueEffetsFinal
                  }
                };

                const salveWpnD = {
                  _id:i._id,
                  name:game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.CEA.SALVE.Label'),
                  system:{
                    capaciteName:'cea',
                    subCapaciteName:'salve',
                    noRack:true,
                    capacite:true,
                    portee:capacite.salve.portee,
                    energie:capacite.energie,
                    espoir:capacite.espoir,
                    degats:{
                      dice:capacite.salve.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.salve.violence.dice,
                      fixe:0
                    },
                    type:'distance',
                    effets:salveEffetsFinal
                  }
                };

                const rayonWpnD = {
                  _id:i._id,
                  name:game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.CEA.RAYON.Label'),
                  system:{
                    capaciteName:'cea',
                    subCapaciteName:'rayon',
                    noRack:true,
                    capacite:true,
                    portee:capacite.rayon.portee,
                    energie:capacite.energie,
                    espoir:capacite.espoir,
                    degats:{
                      dice:capacite.rayon.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.rayon.violence.dice,
                      fixe:0
                    },
                    type:'distance',
                    effets:rayonEffetsFinal
                  }
                };

                armesContactEquipee.push(vagueWpnC);
                armesContactEquipee.push(salveWpnC);
                armesContactEquipee.push(rayonWpnC);

                armesDistanceEquipee.push(vagueWpnD);
                armesDistanceEquipee.push(salveWpnD);
                armesDistanceEquipee.push(rayonWpnD);
              }
              break;

            case "borealis":
              if(wear === 'armure') {
                const borealisEffets = capacite.offensif.effets;
                const borealisEffetsRaw = borealisEffets.raw.concat(armorSpecialRaw);
                const borealisEffetsCustom = borealisEffets.custom.concat(armorSpecialCustom) || [];
                const borealisEffetsFinal = {
                  raw:[...new Set(borealisEffetsRaw)],
                  custom:borealisEffetsCustom,
                  liste:borealisEffets.liste
                };

                const borealisWpnC = {
                  _id:i._id,
                  name:`${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.BOREALIS.Label')} - ${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.BOREALIS.OFFENSIF.Label')}`,
                  system:{
                    capaciteName:'borealis',
                    subCapaciteName:'offensif',
                    noRack:true,
                    capacite:true,
                    portee:game.i18n.localize(`KNIGHT.PORTEE.${capacite.offensif.portee.charAt(0).toUpperCase()+capacite.offensif.portee.substr(1)}`),
                    energie:capacite.offensif.energie,
                    degats:{
                      dice:capacite.offensif.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.offensif.violence.dice,
                      fixe:0
                    },
                    type:'contact',
                    effets:borealisEffetsFinal
                  }
                };

                const borealisWpnD = {
                  _id:i._id,
                  name:`${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.BOREALIS.Label')} - ${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.BOREALIS.OFFENSIF.Label')}`,
                  system:{
                    capaciteName:'borealis',
                    subCapaciteName:'offensif',
                    noRack:true,
                    capacite:true,
                    portee:game.i18n.localize(`KNIGHT.PORTEE.${capacite.offensif.portee.charAt(0).toUpperCase()+capacite.offensif.portee.substr(1)}`),
                    energie:capacite.offensif.energie,
                    degats:{
                      dice:capacite.offensif.degats.dice,
                      fixe:0
                    },
                    violence:{
                      dice:capacite.offensif.violence.dice,
                      fixe:0
                    },
                    type:'distance',
                    effets:borealisEffetsFinal
                  }
                };

                armesContactEquipee.push(borealisWpnC);

                armesDistanceEquipee.push(borealisWpnD);
              }
              break;

            case "changeling":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.changeling.actif) {
                  i.system.capacites.selected[key].energie.personnel = passiveUltime.capacites.changeling.update.energie.personnel;
                  i.system.capacites.selected[key].duree = passiveUltime.capacites.changeling.update.duree;
                  i.system.capacites.selected[key].odBonus = {
                    actif:true,
                    bonus:passiveUltime.capacites.changeling.update.odbonus,
                    caracteristique:passiveUltime.capacites.changeling.update.caracteristique,
                  };
                }
              }
              break;

            case "companions":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.companions.actif) {
                  i.system.capacites.selected[key].deployable = passiveUltime.capacites.companions.update.deployables;
                }
              }
              break;

            case "ghost":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.ghost.actif) {
                  i.system.capacites.selected[key].desactivation = passiveUltime.capacites.ghost.update.desactivation;
                }
              }
              break;

            case "goliath":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.goliath.actif) {
                  i.system.capacites.selected[key] = Object.assign(i.system.capacites.selected[key], {
                    armesRack:{
                      active:false
                    },
                    taille:{
                      max:passiveUltime.capacites.goliath.update.taille.max
                    },
                    malus:{
                      reaction:passiveUltime.capacites.goliath.update.malus.reaction.value,
                      defense:passiveUltime.capacites.goliath.update.malus.defense.value
                    }
                  });
                }
              }
              break;

            case "mechanic":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.mechanic.actif) {
                  i.system.capacites.selected[key].reparation.contact.dice = +capacite.reparation.contact.dice + passiveUltime.capacites.mechanic.update.bonus;
                  i.system.capacites.selected[key].reparation.distance.dice = +capacite.reparation.distance.dice + passiveUltime.capacites.mechanic.update.bonus;
                }
              }
              break;

            case "morph":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.morph.actif) {
                  i.system.capacites.selected[key] = Object.assign(i.system.capacites.selected[key], {
                    etirement:{
                      portee:passiveUltime.capacites.morph.update.etirement.portee,
                    },
                    fluide:{
                      bonus:{
                        reaction:passiveUltime.capacites.morph.update.fluide.bonus.reaction,
                        defense:passiveUltime.capacites.morph.update.fluide.bonus.defense
                      }
                    },
                    metal:{
                      bonus:{
                        champDeForce:passiveUltime.capacites.morph.update.metal.bonus.champDeForce,
                      }
                    },
                    polymorphie:{
                      canon:{
                        degats:{
                          dice:passiveUltime.capacites.morph.update.polymorphie.canon.degats.dice,
                          fixe:passiveUltime.capacites.morph.update.polymorphie.canon.degats.fixe,
                        },
                        violence:{
                          dice:passiveUltime.capacites.morph.update.polymorphie.canon.violence.dice,
                          fixe:passiveUltime.capacites.morph.update.polymorphie.canon.violence.fixe,
                        },
                        effets:{
                          raw:capacite.polymorphie.canon.effets.raw.concat(passiveUltime.capacites.morph.update.polymorphie.canon.effets.raw),
                          custom:capacite.polymorphie.canon.effets.custom.concat(passiveUltime.capacites.morph.update.polymorphie.canon.effets.custom),
                        }
                      },
                      griffe:{
                        degats:{
                          dice:passiveUltime.capacites.morph.update.polymorphie.griffe.degats.dice,
                          fixe:passiveUltime.capacites.morph.update.polymorphie.griffe.degats.fixe,
                        },
                        violence:{
                          dice:passiveUltime.capacites.morph.update.polymorphie.griffe.violence.dice,
                          fixe:passiveUltime.capacites.morph.update.polymorphie.griffe.violence.fixe,
                        },
                        effets:{
                          raw:capacite.polymorphie.griffe.effets.raw.concat(passiveUltime.capacites.morph.update.polymorphie.griffe.effets.raw),
                          custom:capacite.polymorphie.griffe.effets.custom.concat(passiveUltime.capacites.morph.update.polymorphie.griffe.effets.custom),
                        }
                      },
                      lame:{
                        degats:{
                          dice:passiveUltime.capacites.morph.update.polymorphie.lame.degats.dice,
                          fixe:passiveUltime.capacites.morph.update.polymorphie.lame.degats.fixe,
                        },
                        violence:{
                          dice:passiveUltime.capacites.morph.update.polymorphie.lame.violence.dice,
                          fixe:passiveUltime.capacites.morph.update.polymorphie.lame.violence.fixe,
                        },
                        effets:{
                          raw:capacite.polymorphie.lame.effets.raw.concat(passiveUltime.capacites.morph.update.polymorphie.lame.effets.raw),
                          custom:capacite.polymorphie.lame.effets.custom.concat(passiveUltime.capacites.morph.update.polymorphie.lame.effets.custom),
                        }
                      }
                    },
                    vol:{
                      description:passiveUltime.capacites.morph.update.vol.description,
                    }
                  });
                }
              }

              const activeMorph = capacite?.active?.morph || false;
              if(wear === 'armure' && activeMorph) {
                if(capacite.active.polymorphieLame) {
                  const lameEffets = capacite.polymorphie.lame.effets;
                  const lameEffetsRaw = lameEffets.raw.concat(armorSpecialRaw);
                  const lameEffetsCustom = lameEffets.custom.concat(armorSpecialCustom) || [];
                  const lameEffetsFinal = {
                    raw:[...new Set(lameEffetsRaw)],
                    custom:lameEffetsCustom,
                    liste:lameEffets.liste
                  };

                  const lame = {
                    _id:i._id,
                    name:`${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.MORPH.CAPACITES.POLYMORPHIE.Label')} - ${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.MORPH.CAPACITES.POLYMORPHIE.Lame')}`,
                    system:{
                      capaciteName:'morph',
                      subCapaciteName:'polymorphie',
                      subSubCapaciteName:'lame',
                      noRack:true,
                      capacite:true,
                      portee:game.i18n.localize(`KNIGHT.PORTEE.${capacite.polymorphie.lame.portee.charAt(0).toUpperCase()+capacite.polymorphie.lame.portee.substr(1)}`),
                      degats:{
                        dice:capacite.polymorphie.lame.degats.dice,
                        fixe:capacite.polymorphie.lame.degats.fixe
                      },
                      violence:{
                        dice:capacite.polymorphie.lame.violence.dice,
                        fixe:capacite.polymorphie.lame.violence.fixe
                      },
                      type:'contact',
                      effets:lameEffetsFinal
                    }
                  };

                  const bDefense = lameEffetsFinal.raw.find(str => { if(str.includes('defense')) return str; });
                  const bReaction = lameEffetsFinal.raw.find(str => { if(str.includes('reaction')) return str; })

                  if(bDefense !== undefined) defense.bonus += +bDefense.split(' ')[1];
                  if(bReaction !== undefined) reaction.bonus += +bReaction.split(' ')[1];

                  armesContactEquipee.push(lame);
                }

                if(capacite.active.polymorphieGriffe) {
                  const griffeEffets = capacite.polymorphie.griffe.effets;
                  const griffeEffetsRaw = griffeEffets.raw.concat(armorSpecialRaw);
                  const griffeEffetsCustom = griffeEffets.custom.concat(armorSpecialCustom) || [];
                  const griffeEffetsFinal = {
                    raw:[...new Set(griffeEffetsRaw)],
                    custom:griffeEffetsCustom,
                    liste:griffeEffets.liste
                  };

                  const griffe = {
                    _id:i._id,
                    name:`${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.MORPH.CAPACITES.POLYMORPHIE.Label')} - ${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.MORPH.CAPACITES.POLYMORPHIE.Griffe')}`,
                    system:{
                      capaciteName:'morph',
                      subCapaciteName:'polymorphie',
                      subSubCapaciteName:'griffe',
                      noRack:true,
                      capacite:true,
                      portee:game.i18n.localize(`KNIGHT.PORTEE.${capacite.polymorphie.griffe.portee.charAt(0).toUpperCase()+capacite.polymorphie.griffe.portee.substr(1)}`),
                      degats:{
                        dice:capacite.polymorphie.griffe.degats.dice,
                        fixe:capacite.polymorphie.griffe.degats.fixe
                      },
                      violence:{
                        dice:capacite.polymorphie.griffe.violence.dice,
                        fixe:capacite.polymorphie.griffe.violence.fixe
                      },
                      type:'contact',
                      effets:griffeEffetsFinal
                    }
                  };

                  const bDefense = griffeEffetsFinal.raw.find(str => { if(str.includes('defense')) return str; });
                  const bReaction = griffeEffetsFinal.raw.find(str => { if(str.includes('reaction')) return str; })

                  if(bDefense !== undefined) defense.bonus += +bDefense.split(' ')[1];
                  if(bReaction !== undefined) reaction.bonus += +bReaction.split(' ')[1];

                  armesContactEquipee.push(griffe);
                };

                if(capacite.active.polymorphieCanon) {
                  const canonEffets = capacite.polymorphie.canon.effets;
                  const canonEffetsRaw = canonEffets.raw.concat(armorSpecialRaw);
                  const canonEffetsCustom = canonEffets.custom.concat(armorSpecialCustom) || [];
                  const canonEffetsFinal = {
                    raw:[...new Set(canonEffetsRaw)],
                    custom:canonEffetsCustom,
                    liste:canonEffets.liste
                  };

                  const canon = {
                    _id:i._id,
                    name:`${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.MORPH.CAPACITES.POLYMORPHIE.Label')} - ${game.i18n.localize('KNIGHT.ITEMS.ARMURE.CAPACITES.MORPH.CAPACITES.POLYMORPHIE.Canon')}`,
                    system:{
                      capaciteName:'morph',
                      subCapaciteName:'polymorphie',
                      subSubCapaciteName:'canon',
                      noRack:true,
                      capacite:true,
                      portee:game.i18n.localize(`KNIGHT.PORTEE.${capacite.polymorphie.canon.portee.charAt(0).toUpperCase()+capacite.polymorphie.canon.portee.substr(1)}`),
                      energie:capacite.polymorphie.canon.energie,
                      degats:{
                        dice:capacite.polymorphie.canon.degats.dice,
                        fixe:capacite.polymorphie.canon.degats.fixe
                      },
                      violence:{
                        dice:capacite.polymorphie.canon.violence.dice,
                        fixe:capacite.polymorphie.canon.violence.fixe
                      },
                      type:'distance',
                      effets:canonEffetsFinal
                    }
                  };

                  const bDefense = canonEffetsFinal.raw.find(str => { if(str.includes('defense')) return str; });
                  const bReaction = canonEffetsFinal.raw.find(str => { if(str.includes('reaction')) return str; })

                  if(bDefense !== undefined) defense.bonus += +bDefense.split(' ')[1];
                  if(bReaction !== undefined) reaction.bonus += +bReaction.split(' ')[1];

                  armesDistanceEquipee.push(canon);
                }
              }
              break;

            case "oriflamme":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.oriflamme.actif) {
                  i.system.capacites.selected[key] = Object.assign(i.system.capacites.selected[key], {
                    activation:passiveUltime.capacites.oriflamme.update.activation,
                    duree:passiveUltime.capacites.oriflamme.update.duree,
                    portee:passiveUltime.capacites.oriflamme.update.portee,
                    energie:passiveUltime.capacites.oriflamme.update.energie,
                    degats:{
                      dice:passiveUltime.capacites.oriflamme.update.degats.dice,
                      fixe:passiveUltime.capacites.oriflamme.update.degats.fixe,
                    },
                    violence:{
                      dice:passiveUltime.capacites.oriflamme.update.violence.dice,
                      fixe:passiveUltime.capacites.oriflamme.update.violence.fixe,
                    },
                    effets:{
                      raw:passiveUltime.capacites.oriflamme.update.effets.raw,
                      custom:passiveUltime.capacites.oriflamme.update.effets.custom,
                    }
                  });
                }
              }

              break;

            case "rage":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.rage.actif) {
                  i.system.capacites.selected[key] = Object.assign(i.system.capacites.selected[key], {
                    fureur:{
                      defense:passiveUltime.capacites.rage.update.fureur.defense,
                      reaction:passiveUltime.capacites.rage.update.fureur.reaction,
                      subis:passiveUltime.capacites.rage.update.fureur.subis,
                      combosInterdits:{
                        has:passiveUltime.capacites.rage.update.fureur.combosInterdits.has,
                      }
                    },
                    colere:{
                      defense:passiveUltime.capacites.rage.update.colere.defense,
                      reaction:passiveUltime.capacites.rage.update.colere.reaction,
                      subis:passiveUltime.capacites.rage.update.colere.subis,
                      combosInterdits:{
                        has:passiveUltime.capacites.rage.update.colere.combosInterdits.has,
                      }
                    },
                    rage:{
                      defense:passiveUltime.capacites.rage.update.rage.defense,
                      reaction:passiveUltime.capacites.rage.update.rage.reaction,
                      subis:passiveUltime.capacites.rage.update.rage.subis,
                      combosInterdits:{
                        has:passiveUltime.capacites.rage.update.rage.combosInterdits.has,
                      }
                    }
                  });
                }
              }
              break;

            case "longbow":
              if(wear === 'armure') {
                const dataLongbow = capacite;

                longbow = dataLongbow;
                longbow['has'] = true;
                longbow.energie = 0;

                longbow.degats.cout = 0;
                longbow.degats.dice = dataLongbow.degats.min;

                longbow.violence.cout = 0;
                longbow.violence.dice = dataLongbow.violence.min;

                const rangeListe = ['contact', 'courte', 'moyenne', 'longue', 'lointaine'];
                let rangeToNumber = {};
                let peRange = longbow.portee.energie;
                let minRange = longbow.portee.min;
                let maxRange = longbow.portee.max;
                let isInRange = false;
                let multiplicateur = 0;

                for(let n = 0; n < rangeListe.length;n++) {
                  if(rangeListe[n] === minRange) {
                    isInRange = true;
                    rangeToNumber[rangeListe[n]] = multiplicateur*peRange;
                    multiplicateur += 1;
                  } else if(rangeListe[n] === maxRange) {
                    isInRange = false;
                    rangeToNumber[rangeListe[n]] = multiplicateur*peRange;
                  } else if(isInRange) {
                    rangeToNumber[rangeListe[n]] = multiplicateur*peRange;
                    multiplicateur += 1;
                  }
                }

                longbow.portee.cout = 0;
                longbow.portee.value = dataLongbow.portee.min;
                longbow.portee.rangeToNumber = rangeToNumber;

                longbow.effets.raw = armorSpecialRaw;
                longbow.effets.custom = armorSpecialCustom;
                longbow.effets.liste = [];
                longbow.effets.liste1.cout = 0;
                longbow.effets.liste1.selected = 0;
                longbow.effets.liste2.cout = 0;
                longbow.effets.liste2.selected = 0;
                longbow.effets.liste3.cout = 0;
                longbow.effets.liste3.selected = 0;
              }
              break;

            case "type":
              const arrayTypes = Object.entries(capacite.type)
              const filterTypes = arrayTypes.filter(([key, value]) => (value.selectionne === true && value.conflit === true) || (value.selectionne === true && value.horsconflit === true));
              const bonus = filterTypes?.[0]?.[1] || false;

              if(bonus !== false) {
                for (let [keyC, carac] of Object.entries(bonus.liste)){
                  aspects[bonus.aspect].caracteristiques[keyC].overdrive.bonus += carac.value;
                }
              }

              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif) i.system.capacites.selected[key].double = passiveUltime.capacites.type.actif;
              }
              break;

            case "vision":
              if(armorData.capacites.vision.energie < capacite.energie.min) armorData.capacites.vision.energie = capacite.energie.min;

              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.vision.actif) {
                  i.system.capacites.selected[key].duree = passiveUltime.capacites.vision.update.duree;
                  i.system.capacites.selected[key].prolonger = true;
                }
              }
              break;

            case "warlord":
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.capacites.warlord.actif) {
                  i.system.capacites.selected[key].impulsions.simultane = passiveUltime.capacites.warlord.update.activer;
                  i.system.capacites.selected[key].impulsions.prolonge = passiveUltime.capacites.warlord.update.prolonger;
                }
              }
              break;
          }
        }

        const totalPG = +system.progression.gloire.total;

        for (let [key, evolution] of Object.entries(armorEvolutions.liste)) {
          const PGEvo = +evolution.value;
          const AlreadyEvo = evolution.applied;

          if(!AlreadyEvo && PGEvo <= totalPG) {
            evolutionsAchetables.push({
              id:key,
              value:PGEvo
            });
          } else if(AlreadyEvo) {
            depensePG.push({
              order:evolution.addOrder,
              isArmure:true,
              value:PGEvo
            });
          }
        }

        const companionsEvolutions = armorEvolutions?.special?.companions || false;

        if(companionsEvolutions !== false) {
          const valueEvo = +companionsEvolutions.value;
          const nbreEvo = Math.floor(totalPG/+companionsEvolutions.value);
          const nbreEvoApplied = companionsEvolutions?.applied?.value || 0;
          const listeEvoApplied = companionsEvolutions?.applied?.liste || [];

          if(nbreEvo > nbreEvoApplied) {
            for(let n = nbreEvoApplied+1; n <= nbreEvo;n++) {
              evolutionsCompanions.push({
                value:valueEvo*n
              });
            }
          }

          for(let n = 0; n < listeEvoApplied.length;n++) {
            depensePG.push({
              order:listeEvoApplied[n].addOrder,
              isArmure:true,
              value:listeEvoApplied[n].value
            });
          }
        }

        const longbowEvolutions = armorEvolutions?.special?.longbow || false;

        if(longbowEvolutions !== false) {
          const PGGratuit1 = +longbowEvolutions['1']?.gratuit || false;
          const PGEvo1 = +longbowEvolutions['1'].value;
          const AlreadyEvo1 = longbowEvolutions['1'].applied;
          const description1 = longbowEvolutions['1'].description;

          if(!AlreadyEvo1) {
            evolutionsAAcheter.push({
              id:1,
              description:description1.replaceAll('<p>', '').replaceAll('</p>', ''),
              value:PGEvo1
            });
          } else if(AlreadyEvo1) {
            depensePG.push({
              id:i._id,
              order:longbowEvolutions['1'].addOrder,
              isAcheter:true,
              value:PGGratuit1 ? 0 : PGEvo1,
              gratuit:PGGratuit1,
              evo:1
            });
          }

          const PGGratuit2 = +longbowEvolutions['2']?.gratuit || false;
          const PGEvo2 = +longbowEvolutions['2'].value;
          const AlreadyEvo2 = longbowEvolutions['2'].applied;
          const description2 = longbowEvolutions['2'].description;

          if(!AlreadyEvo2) {
            evolutionsAAcheter.push({
              id:2,
              description:description2.replaceAll('<p>', '').replaceAll('</p>', ''),
              value:PGEvo2
            });
          } else if(AlreadyEvo2) {
            depensePG.push({
              id:i._id,
              order:longbowEvolutions['2'].addOrder,
              isAcheter:true,
              value:PGGratuit2 ? 0 : PGEvo2,
              gratuit:PGGratuit2,
              evo:2
            });
          }

          const PGGratuit3 = +longbowEvolutions['3']?.gratuit || false;
          const PGEvo3 = +longbowEvolutions['3'].value;
          const AlreadyEvo3 = longbowEvolutions['3'].applied;
          const description3 = longbowEvolutions['3'].description;

          if(!AlreadyEvo3) {
            evolutionsAAcheter.push({
              id:3,
              description:description3.replaceAll('<p>', '').replaceAll('</p>', ''),
              value:PGEvo3
            });
          } else if(AlreadyEvo3) {
            depensePG.push({
              id:i._id,
              order:longbowEvolutions['3'].addOrder,
              isAcheter:true,
              value:PGGratuit3 ? 0 : PGEvo3,
              gratuit:PGGratuit3,
              evo:3
            });
          }

          const PGGratuit4 = +longbowEvolutions['4']?.gratuit || false;
          const PGEvo4 = +longbowEvolutions['4'].value;
          const AlreadyEvo4 = longbowEvolutions['4'].applied;
          const description4 = longbowEvolutions['4'].description;

          if(!AlreadyEvo4) {
            evolutionsAAcheter.push({
              id:4,
              description:description4.replaceAll('<p>', '').replaceAll('</p>', ''),
              value:PGEvo4
            });
          } else if(AlreadyEvo4) {
            depensePG.push({
              id:i._id,
              order:longbowEvolutions['4'].addOrder,
              isAcheter:true,
              value:PGGratuit4 ? 0 : PGEvo4,
              gratuit:PGGratuit4,
              evo:4
            });
          }
        }

        for (let [key, special] of Object.entries(armorSpecial)) {
          switch(key) {
            case 'contrecoups':
              if(passiveUltime !== undefined) {
                if(passiveUltime.capacites.actif && passiveUltime.special.contrecoups.actif) {
                  i.system.special.selected[key].unactif = true;
                }
              }
              break;
          }
        }

        if(wear === 'armure' || wear === 'ascension') {
          for (let [key, special] of Object.entries(armorSpecial)) {
            switch(key) {
              case 'apeiron':
                espoir.bonus.armure.push(special.espoir.bonus);
                break;

              case 'plusespoir':
                if(!espoir.aucun) {
                  const armureRecupEspoir = special.espoir.recuperation.value === false ? true : false;

                  espoir.aucun = armureRecupEspoir;
                }

                if(!espoir.perte.saufAgonie) {
                  const armurePerteSAgonie = special.espoir.perte.value === false ? true : false;

                  espoir.perte.saufAgonie = armurePerteSAgonie;
                }
                break;

              case 'contrecoups':
                sheetData.data.system.restrictions.noArmeDistance = !special.armedistance.value ? true : false;
                sheetData.data.system.restrictions.maxEffetsArmeContact = {};
                sheetData.data.system.restrictions.maxEffetsArmeContact.has = special.maxeffets.value;
                sheetData.data.system.restrictions.maxEffetsArmeContact.value = special.maxeffets.max;
                break;

              case 'recolteflux':
                if(passiveUltime !== undefined) {
                  if(passiveUltime.capacites.actif && passiveUltime.special.recolteflux.actif) {
                    i.system.special.selected[key] = {
                      conflit:{
                        base:passiveUltime.special.recolteflux.update.conflit.base,
                        tour:passiveUltime.special.recolteflux.update.conflit.tour,
                      },
                      horsconflit:{
                        base:passiveUltime.special.recolteflux.update.horsconflit.base
                      }
                    }
                  }
                }
                break;
            }
          }

          for (let [keyA, aspect] of Object.entries(aspects)) {
            for (let [keyC, carac] of Object.entries(aspect.caracteristiques)) {
              const value = +i?.system?.overdrives?.[keyA]?.liste?.[keyC]?.value || 0;
              console.log()
              const aspectExist = aspectsUpdate?.[keyA] || false;
              const caracsListExist = aspectsUpdate?.[keyA]?.caracteristiques || false;
              const caracsExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC] || false;
              const odExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.overdrive || false;
              const odBaseExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.overdrive?.base || false;

              if(value > 0) {
                if(!aspectExist) aspectsUpdate[keyA] = {};
                if(!caracsListExist) aspectsUpdate[keyA].caracteristiques = {}
                if(!caracsExist) aspectsUpdate[keyA].caracteristiques[keyC] = {}
                if(!odExist) aspectsUpdate[keyA].caracteristiques[keyC].overdrive = {}
                if(!odBaseExist) aspectsUpdate[keyA].caracteristiques[keyC].overdrive.base = [];

                aspectsUpdate[keyA].caracteristiques[keyC].overdrive.base.push(value);
              }
            }
          }
        }

        armureData = i;
      }

      // MODULE
      if (i.type === 'module') {
        const isLion = data.isLion;
        const itemSlots = data.slots;
        const itemBonus = data.bonus;
        const itemArme = data.arme;
        const itemOD = data.overdrives;
        const itemActive = data?.active?.base || false;
        const iBOD = itemBonus.overdrives;
        const itemErsatz = data.ersatz;
        const eRogue = itemErsatz.rogue;
        const eBard = itemErsatz.bard;

        if(isLion) {
          lion.modules.push(i);

          if(data.permanent || itemActive) {
            if(itemBonus.has) {
              const iBArmure = itemBonus.armure;
              const iBCDF = itemBonus.champDeForce;
              const iBEnergie = itemBonus.energie;
              const iBDgts = itemBonus.degats;
              const iBDgtsVariable = iBDgts.variable;
              const iBViolence = itemBonus.violence;
              const iBViolenceVariable = iBViolence.variable;

              if(iBArmure.has) { lion.armure.bonus.push(iBArmure.value); }
              if(iBCDF.has) { lion.champDeForce.bonus.push(iBCDF.value); }
              if(iBEnergie.has) { lion.energie.bonus.push(iBEnergie.value); }
              if(iBDgts.has) {
                if(iBDgtsVariable.has) {
                  const dgtsDicePaliers = [0];
                  const dgtsFixePaliers = [0];

                  for(let i = iBDgtsVariable.min.dice;i <= iBDgtsVariable.max.dice;i++) {
                    dgtsDicePaliers.push(i);
                  }

                  for(let i = iBDgtsVariable.min.fixe;i <= iBDgtsVariable.max.fixe;i++) {
                    dgtsFixePaliers.push(i);
                  }

                  lion.bonusDgtsVariable[iBDgts.type].push({
                    label:i.name,
                    description:data.description,
                    selected:{
                      dice:iBDgtsVariable?.selected?.dice || 0,
                      fixe:iBDgtsVariable?.selected?.fixe || 0,
                      energie:{
                        dice:iBDgtsVariable?.selected?.energie.dice || 0,
                        fixe:iBDgtsVariable?.selected?.energie.fixe || 0,
                        paliers:{
                          dice:dgtsDicePaliers,
                          fixe:dgtsFixePaliers
                        }
                      }
                    },
                    min:{
                      dice:iBDgtsVariable.min.dice,
                      fixe:iBDgtsVariable.min.fixe
                    },
                    max:{
                      dice:iBDgtsVariable.max.dice,
                      fixe:iBDgtsVariable.max.fixe
                    }
                  });
                } else {
                  lion.bonusDgts[iBDgts.type].push({
                    label:i.name,
                    description:data.description,
                    dice:iBDgts.dice,
                    fixe:iBDgts.fixe
                  });
                }
              }
              if(iBViolence.has) {
                if(iBViolenceVariable.has) {
                  const violDicePaliers = [0];
                  const violFixePaliers = [0];

                  for(let i = iBViolenceVariable.min.dice;i <= iBViolenceVariable.max.dice;i++) {
                    violDicePaliers.push(i);
                  }

                  for(let i = iBViolenceVariable.min.fixe;i <= iBViolenceVariable.max.fixe;i++) {
                    violFixePaliers.push(i);
                  }

                  lion.bonusViolenceVariable[iBViolence.type].push({
                    label:i.name,
                    description:i.system.description,
                    selected:{
                      dice:iBViolenceVariable?.selected?.dice || 0,
                      fixe:iBViolenceVariable?.selected?.fixe || 0,
                      energie:{
                        dice:iBViolenceVariable?.selected?.energie.dice || 0,
                        fixe:iBViolenceVariable?.selected?.energie.fixe || 0,
                        paliers:{
                          dice:violDicePaliers,
                          fixe:violFixePaliers
                        }
                      }
                    },
                    min:{
                      dice:iBViolenceVariable.min.dice,
                      fixe:iBViolenceVariable.min.fixe
                    },
                    max:{
                      dice:iBViolenceVariable.max.dice,
                      fixe:iBViolenceVariable.max.fixe
                    }
                  });
                } else {
                  lion.bonusViolence[iBViolence.type].push({
                    label:i.name,
                    description:i.system.description,
                    dice:iBViolence.dice,
                    fixe:iBViolence.fixe
                  });
                }
              }
            }

            if(itemArme.has) {
              const moduleEffets = itemArme.effets;
              const moiduleEffetsRaw = moduleEffets.raw.concat(armorSpecialRaw);
              const moduleEffetsCustom = moduleEffets.custom.concat(armorSpecialCustom) || [];
              const moduleEffetsFinal = {
                raw:[...new Set(moiduleEffetsRaw)],
                custom:moduleEffetsCustom,
                liste:moduleEffets.liste
              };

              const moduleWpn = {
                _id:i._id,
                name:i.name,
                type:'module',
                system:{
                  noRack:true,
                  type:itemArme.type,
                  portee:itemArme.portee,
                  degats:itemArme.degats,
                  violence:itemArme.violence,
                  effets:{
                    raw:moiduleEffetsRaw,
                    custom:moduleEffetsCustom,
                    liste:moduleEffets.liste
                  }
                }
              }

              const bDefense = moduleEffetsFinal.raw.find(str => { if(str.includes('defense')) return str; });
              const bReaction = moduleEffetsFinal.raw.find(str => { if(str.includes('reaction')) return str; });

              if(bDefense !== undefined) lion.defense.bonus += +bDefense.split(' ')[1];
              if(bReaction !== undefined) lion.reaction.bonus += +bReaction.split(' ')[1];

              if(itemArme.type === 'contact') {
                const bMassive = itemArme.structurelles.raw.find(str => { if(str.includes('massive')) return true; });
                if(bMassive) lion.defense.malus += 1;

                lion.armes.contact.push(moduleWpn);
              }

              if(itemArme.type === 'distance') {
                lion.armes.distance.push(moduleWpn);
              }
            }
          }

        } else {
          slots.tete += itemSlots.tete;
          slots.torse += itemSlots.torse;
          slots.brasGauche += itemSlots.brasGauche;
          slots.brasDroit += itemSlots.brasDroit;
          slots.jambeGauche += itemSlots.jambeGauche;
          slots.jambeDroite += itemSlots.jambeDroite;

          if(data.permanent || itemActive) {
            if(wear === 'armure' || wear === 'ascension') {
              if(itemBonus.has) {
                const iBArmure = itemBonus.armure;
                const iBCDF = itemBonus.champDeForce;
                const iBEnergie = itemBonus.energie;
                const iBDgts = itemBonus.degats;
                const iBDgtsVariable = iBDgts.variable;
                const iBViolence = itemBonus.violence;
                const iBViolenceVariable = iBViolence.variable;
                const iBGrenades = itemBonus.grenades;

                if(iBArmure.has) { armure.bonus.modules.push(iBArmure.value); }
                if(iBCDF.has) { champDeForce.bonus.modules.push(iBCDF.value); }
                if(iBEnergie.has) { energie.bonus.modules.push(iBEnergie.value); }
                if(iBDgts.has) {
                  if(iBDgtsVariable.has) {
                    const dgtsDicePaliers = [0];
                    const dgtsFixePaliers = [0];

                    for(let i = iBDgtsVariable.min.dice;i <= iBDgtsVariable.max.dice;i++) {
                      dgtsDicePaliers.push(i);
                    }

                    for(let i = iBDgtsVariable.min.fixe;i <= iBDgtsVariable.max.fixe;i++) {
                      dgtsFixePaliers.push(i);
                    }

                    moduleBonusDgtsVariable[iBDgts.type].push({
                      id:i._id,
                      label:i.name,
                      description:i.system.description,
                      selected:{
                        dice:iBDgtsVariable?.selected?.dice || 0,
                        fixe:iBDgtsVariable?.selected?.fixe || 0,
                        energie:{
                          dice:iBDgtsVariable?.selected?.energie.dice || 0,
                          fixe:iBDgtsVariable?.selected?.energie.fixe || 0,
                          paliers:{
                            dice:dgtsDicePaliers,
                            fixe:dgtsFixePaliers
                          }
                        }
                      },
                      min:{
                        dice:iBDgtsVariable.min.dice,
                        fixe:iBDgtsVariable.min.fixe
                      },
                      max:{
                        dice:iBDgtsVariable.max.dice,
                        fixe:iBDgtsVariable.max.fixe
                      },
                      energie:iBDgtsVariable.cout
                    });
                  } else {
                    moduleBonusDgts[iBDgts.type].push({
                      id:i._id,
                      label:i.name,
                      description:i.system.description,
                      dice:iBDgts.dice,
                      fixe:iBDgts.fixe
                    });
                  }
                }
                if(iBViolence.has) {
                  if(iBViolenceVariable.has) {
                    const violDicePaliers = [0];
                    const violFixePaliers = [0];

                    for(let i = iBViolenceVariable.min.dice;i <= iBViolenceVariable.max.dice;i++) {
                      violDicePaliers.push(i);
                    }

                    for(let i = iBViolenceVariable.min.fixe;i <= iBViolenceVariable.max.fixe;i++) {
                      violFixePaliers.push(i);
                    }

                    moduleBonusViolenceVariable[iBViolence.type].push({
                      id:i._id,
                      label:i.name,
                      description:i.system.description,
                      selected:{
                        dice:iBViolenceVariable?.selected?.dice || 0,
                        fixe:iBViolenceVariable?.selected?.fixe || 0,
                        energie:{
                          dice:iBViolenceVariable?.selected?.energie?.dice || 0,
                          fixe:iBViolenceVariable?.selected?.energie?.fixe || 0,
                          paliers:{
                            dice:violDicePaliers,
                            fixe:violFixePaliers
                          }
                        }
                      },
                      min:{
                        dice:iBViolenceVariable.min.dice,
                        fixe:iBViolenceVariable.min.fixe
                      },
                      max:{
                        dice:iBViolenceVariable.max.dice,
                        fixe:iBViolenceVariable.max.fixe
                      },
                      energie:iBViolenceVariable.cout
                    });
                  } else {
                    moduleBonusViolence[iBViolence.type].push({
                      id:i._id,
                      label:i.name,
                      description:i.system.description,
                      dice:iBViolence.dice,
                      fixe:iBViolence.fixe
                    });
                  }
                }
                if(iBGrenades.has) {
                  for (let [key, grenade] of Object.entries(grenades)) {
                    if(key === 'antiblindage' || key === 'explosive' || key === 'shrapnel') {
                      const data = iBGrenades.liste[key];

                      grenade.degats.dice += data.degats.dice;
                      grenade.violence.dice += data.violence.dice;
                    }
                  };
                }
              }

              if(itemArme.has) {
                const moduleEffets = itemArme.effets;
                const moiduleEffetsRaw = moduleEffets.raw.concat(armorSpecialRaw);
                const moduleEffetsCustom = moduleEffets.custom.concat(armorSpecialCustom) || [];
                const moduleEffetsFinal = {
                  raw:[...new Set(moiduleEffetsRaw)],
                  custom:moduleEffetsCustom,
                  liste:moduleEffets.liste
                };

                const moduleWpn = {
                  _id:i._id,
                  name:i.name,
                  type:'module',
                  system:{
                    noRack:true,
                    type:itemArme.type,
                    portee:itemArme.portee,
                    degats:itemArme.degats,
                    violence:itemArme.violence,
                    effets:moduleEffetsFinal
                  }
                };

                const bDefense = moduleEffetsFinal.raw.find(str => { if(str.includes('defense')) return str; });
                const bReaction = moduleEffetsFinal.raw.find(str => { if(str.includes('reaction')) return str; });

                if(bDefense !== undefined) defense.bonus += +bDefense.split(' ')[1];
                if(bReaction !== undefined) reaction.bonus += +bReaction.split(' ')[1];

                if(itemArme.type === 'contact') {
                  const bMassive = itemArme.structurelles.raw.find(str => { if(str.includes('massive')) return true; });
                  if(bMassive) defense.malus += 1;

                  armesContactEquipee.push(moduleWpn);
                }

                if(itemArme.type === 'distance') {
                  armesDistanceEquipee.push(moduleWpn);
                }
              }

              if(itemOD.has || (itemBonus.has && iBOD.has)) {
                for (let [keyA, aspect] of Object.entries(aspects)) {
                  for (let [keyC, carac] of Object.entries(aspect.caracteristiques)) {
                    const base = +itemOD.aspects[keyA][keyC] || 0;
                    const bonus = +iBOD.aspects[keyA][keyC] || 0;

                    const aspectExist = aspectsUpdate?.[keyA] || false;
                    const caracsListExist = aspectsUpdate?.[keyA]?.caracteristiques || false;
                    const caracsExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC] || false;
                    const odExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.overdrive || false;
                    const odBaseExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.overdrive?.base || false;
                    const odBonusExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.overdrive?.bonus || false;

                    if((itemOD.has && base > 0) || (itemBonus.has && iBOD.has && bonus > 0)) {
                      if(!aspectExist) aspectsUpdate[keyA] = {};
                      if(!caracsListExist) aspectsUpdate[keyA].caracteristiques = {}
                      if(!caracsExist) aspectsUpdate[keyA].caracteristiques[keyC] = {}
                      if(!odExist) aspectsUpdate[keyA].caracteristiques[keyC].overdrive = {}
                    }

                    if(itemOD.has && base > 0) {
                      if(!odBaseExist) aspectsUpdate[keyA].caracteristiques[keyC].overdrive.base = [];

                      aspectsUpdate[keyA].caracteristiques[keyC].overdrive.base.push(base);
                    }

                    if(itemBonus.has && iBOD.has && bonus > 0) {
                      if(!odBonusExist) aspectsUpdate[keyA].caracteristiques[keyC].overdrive.bonus = [];

                      aspectsUpdate[keyA].caracteristiques[keyC].overdrive.bonus.push(bonus);
                    }
                  }
                }
              }

              if(eRogue.has) {
                moduleErsatz.rogue = eRogue;
                moduleErsatz.rogue.permanent = data.permanent;
                moduleErsatz.rogue.label = i.name;
                moduleErsatz.rogue._id = i._id;
                moduleErsatz.rogue.description = data.description;
              }
              if(eBard.has) {
                moduleErsatz.bard = eBard;
                moduleErsatz.bard.permanent = data.permanent;
                moduleErsatz.bard.label = i.name;
                moduleErsatz.bard._id = i._id;
                moduleErsatz.bard.description = data.description;
              }
            }
          }

          if(data.permanent) modulepassifs.push(i);
          else module.push(i);
          depensePG.push({
            order:data.addOrder,
            name:i.name,
            id:i._id,
            gratuit:data.gratuit,
            value:data.gratuit ? 0 : data.prix
          });
        }
      }

      // AVANTAGE.
      if (i.type === 'avantage') {
        if(data.type === 'standard') {
          avantage.push(i);

          sante.bonus.avantages.push(bonus.sante);
          espoir.bonus.avantages.push(bonus.espoir);
          espoir.recuperationBonus.push(bonus.recuperation.espoir);
          nods.soin.recuperationBonus.push(bonus.recuperation.sante);
          nods.armure.recuperationBonus.push(bonus.recuperation.armure);
          nods.energie.recuperationBonus.push(bonus.recuperation.energie);
          initiative.diceBonus.avantages.push(bonus.initiative.dice);
          initiative.bonus.avantages.push(bonus.initiative.fixe);

          if(bonus.initiative.ifEmbuscade.has) {
            bonusDiceEmbuscadeSubis += +bonus.initiative.ifEmbuscade.dice;
            bonusFixeEmbuscadeSubis += +bonus.initiative.ifEmbuscade.fixe;
          }
        } else if(data.type === 'ia') {
          avantageIA.push(i);
        }
      }

      // INCONVENIENT.
      if (i.type === 'inconvenient') {
        if(data.type === 'standard') {
          inconvenient.push(i);

          sante.malus.desavantages.push(malus.sante);
          espoir.malus.desavantages.push(malus.espoir);
          espoir.recuperationMalus.push(malus.recuperation.espoir);
          initiative.diceMalus.desavantages.push(malus.initiative.dice);
          initiative.malus.desavantages.push(malus.initiative.fixe);

          if(!espoir.aucun) {
            espoir.aucun = limitations.espoir.aucunGain;
          }
        } else if(data.type === 'ia') {
          inconvenientIA.push(i);
        }
      }

      // MOTIVATION MINEURE
      if (i.type === 'motivationMineure') {
        motivationMineure.push(i);
      }

      // CAPACITE HEROIQUE
      if (i.type === 'capaciteheroique') {
        capaciteHeroique.push(i);
      }

      // CARTE HEROIQUE
      if (i.type === 'carteheroique') {
        carteHeroique.push(i);
      }

      // LANGUE
      if (i.type === 'langue') {
        langue.push(i);
      }

      // CONTACT
      if (i.type === 'contact') {
        contact.push(i);
      }

      // BLESSURE
      if (i.type === 'blessure') {
        const dataBlessure = i.system.aspects;
        const soigne = game.i18n.localize("KNIGHT.AUTRE.Soigne");

        if(i.system.soigne.implant) {
          espoir.malus.blessures.push(3);
        }

        if(i.system.soigne.implant || i.system.soigne.reconstruction) { i.name += ` (${soigne})`; }



        for (let [keyA, aspect] of Object.entries(aspects)) {
          const vAspect = +dataBlessure?.[keyA]?.value || false;

          if(vAspect !== false) {
            const aspectExist = aspectsUpdate?.[keyA] || false;
            const aspectMalusExist = aspectsUpdate?.[keyA]?.malus || false;

            if(!aspectExist) aspectsUpdate[keyA] = {};
            if(!aspectMalusExist) aspectsUpdate[keyA].malus = [];

            aspectsUpdate[keyA].malus.push(vAspect);
          }

          for (let [keyC, carac] of Object.entries(aspect.caracteristiques)) {
            const vCaracs = +dataBlessure?.[keyA]?.caracteristiques?.[keyC].value || false;

            if(vCaracs > 0) {
              const aspectExist = aspectsUpdate?.[keyA] || false;
              const caracsListExist = aspectsUpdate?.[keyA]?.caracteristiques || false;
              const caracsExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC] || false;
              const caracsMalusExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.malus || false;

              if(!aspectExist) aspectsUpdate[keyA] = {};
              if(!caracsListExist) aspectsUpdate[keyA].caracteristiques = {};
              if(!caracsExist) aspectsUpdate[keyA].caracteristiques[keyC] = {};
              if(!caracsMalusExist) aspectsUpdate[keyA].caracteristiques[keyC].malus = [];

              aspectsUpdate[keyA].caracteristiques[keyC].malus.push(vCaracs);
            }
          }
        }

        blessures.push(i);
      }

      // TRAUMA
      if (i.type === 'trauma') {
        const dataTrauma = i.system.aspects;

        for (let [keyA, aspect] of Object.entries(aspects)) {
          const vAspect = +dataTrauma?.[keyA]?.value || false;

          if(vAspect !== false) {
            const aspectExist = aspectsUpdate?.[keyA] || false;
            const aspectMalusExist = aspectsUpdate?.[keyA]?.malus || false;

            if(!aspectExist) aspectsUpdate[keyA] = {};
            if(!aspectMalusExist) aspectsUpdate[keyA].malus = [];

            aspectsUpdate[keyA].malus.push(vAspect);
          }

          for (let [keyC, carac] of Object.entries(aspect.caracteristiques)) {
            const vCaracs = +dataTrauma?.[keyA]?.caracteristiques?.[keyC].value || false;

            if(vCaracs > 0) {
              const aspectExist = aspectsUpdate?.[keyA] || false;
              const caracsListExist = aspectsUpdate?.[keyA]?.caracteristiques || false;
              const caracsExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC] || false;
              const caracsMalusExist = aspectsUpdate?.[keyA]?.caracteristiques?.[keyC]?.malus || false;

              if(!aspectExist) aspectsUpdate[keyA] = {};
              if(!caracsListExist) aspectsUpdate[keyA].caracteristiques = {};
              if(!caracsExist) aspectsUpdate[keyA].caracteristiques[keyC] = {};
              if(!caracsMalusExist) aspectsUpdate[keyA].caracteristiques[keyC].malus = [];

              aspectsUpdate[keyA].caracteristiques[keyC].malus.push(vCaracs);
            }
          }
        }

        trauma.push(i);
      }

      // ARMES
      if (i.type === 'arme') {
        const type = data.type;
        const tourelle = data.tourelle;

        const armeRaw = data.effets.raw.concat(armorSpecialRaw);
        const armeCustom = data.effets.custom.concat(armorSpecialCustom);

        const armeE2Raw = data.effets2mains.raw.concat(armorSpecialRaw);
        const armeE2Custom = data.effets2mains.custom.concat(armorSpecialCustom);

        data.effets.raw = [...new Set(armeRaw)];
        data.effets.custom = armeCustom;

        data.effets2mains.raw = [...new Set(armeE2Raw)];
        data.effets2mains.custom = armeE2Custom;

        depensePG.push({
          order:data.addOrder,
          id:i._id,
          name:i.name,
          gratuit:data.gratuit,
          value:data.gratuit ? 0 : data.prix
        });

        if(tourelle.has && type === 'distance') {
          armesTourelles.push(i);
        } else if(wear !== 'ascension') {

          const equipped = data?.equipped || false;
          const rack = data?.rack || false;

          const options2mains = data.options2mains.has;
          const optionsmunitions = data.optionsmunitions.has;
          const main = data.options2mains.actuel;
          const munition = data.optionsmunitions.actuel;
          const effetsRaw = data.effets.raw;

          const bDefense = effetsRaw.find(str => { if(str.includes('defense')) return str; });
          const bReaction = effetsRaw.find(str => { if(str.includes('reaction')) return str; });

          if(type === 'contact' && options2mains === true) {
            data.degats.dice = data?.options2mains?.[main]?.degats?.dice || 0;
            data.degats.fixe = data?.options2mains?.[main]?.degats?.fixe || 0;

            data.violence.dice = data?.options2mains?.[main]?.violence?.dice || 0;
            data.violence.fixe = data?.options2mains?.[main]?.violence?.fixe || 0;
          }

          if(type === 'distance' && optionsmunitions === true) {
            data.degats.dice = data.optionsmunitions?.liste?.[munition]?.degats?.dice || 0;
            data.degats.fixe = data.optionsmunitions?.liste?.[munition]?.degats?.fixe || 0

            data.violence.dice = data.optionsmunitions?.liste?.[munition]?.violence?.dice || 0;
            data.violence.fixe = data.optionsmunitions?.liste?.[munition]?.violence?.fixe || 0;
          }

          if (type === 'contact' && equipped === false && rack === false) { armesContactArmoury.push(i); }
          if (type === 'contact' && equipped === false && rack === true) { armesContactRack.push(i); }
          else if (type === 'contact' && equipped === true) {

            const effets2Raw = i.system.effets2mains.raw;

            const bMassive = i.system.structurelles.raw.find(str => { if(str.includes('massive')) return true; });
            const bArmuregravee = i.system.ornementales.raw.find(str => { if(str.includes('armuregravee')) return true; });
            const bDefense2 = effets2Raw.find(str => { if(str.includes('defense')) return str; });
            const bReaction2 = effets2Raw.find(str => { if(str.includes('reaction')) return str; });

            if((bDefense !== undefined && main === '1main') || (bDefense !== undefined && options2mains === false)) defense.bonus += +bDefense.split(' ')[1];
            if((bReaction !== undefined && main === '1main') || (bReaction !== undefined && options2mains === false)) reaction.bonus += +bReaction.split(' ')[1];

            if(bDefense2 !== undefined && main === '2main' && options2mains === true) defense.bonus += +bDefense2.split(' ')[1];
            if(bReaction2 !== undefined && main === '2main' && options2mains === true) reaction.bonus += +bReaction2.split(' ')[1];

            if(bMassive) defense.malus += 1;

            if(bArmuregravee) champDeForce.bonus.armes += 2

            armesContactEquipee.push(i);
          }
          else if (type === 'distance' && equipped === false && rack === false) { armesDistanceArmoury.push(i); }
          else if (type === 'distance' && equipped === false && rack === true) { armesDistanceRack.push(i); }
          else if (type === 'distance' && equipped === true) {
            const bProtectionarme = i.system.distance.raw.find(str => { if(str.includes('protectionarme')) return true; });

            if(bDefense !== undefined) defense.bonus += +bDefense.split(' ')[1];
            if(bReaction !== undefined) reaction.bonus += +bReaction.split(' ')[1];

            if(bProtectionarme) reaction.bonus += 2;

            armesDistanceEquipee.push(i);
          }
        }
      }

      // ARMURE DE LEGENDE
      if (i.type === 'armurelegende') {
        armureLegendeData = i;

        const armorCapacites = i.system.capacites.selected;

        for (let [key, capacite] of Object.entries(armorCapacites)) {
          switch(key) {
            case "type":
              const arrayTypes = Object.entries(capacite.type)
              const filterTypes = arrayTypes.filter(([key, value]) => (value.selectionne === true && value.conflit === true) || (value.selectionne === true && value.horsconflit === true));
              const bonus = filterTypes?.[0]?.[1] || false;

              if(bonus !== false) {
                for (let [keyC, carac] of Object.entries(bonus.liste)){
                  aspects[bonus.aspect].caracteristiques[keyC].overdrive.bonus += carac.value;
                }
              }
              break;

            case "vision":
              if(armorData.capacites.vision.energie < capacite.energie.min) armorData.capacites.vision.energie = capacite.energie.min;
              break;
          }
        }
      }

      // ART
      if (i.type === 'art') {
        art = i;
      }

      // DISTINCTIONS
      if(i.type === 'distinction') {
        distinctions.push(i);

        espoir.recuperationBonus.push(data.espoir);
        egide.bonus.distinction.push(data.egide);
      }
    }

    for(let [key, PG] of Object.entries(depensePGAutre)) {
      const order = PG?.order || false;

      if(order === false) {
        this.actor.update({[`system.progression.gloire.depense.autre.-=${key}`]:null});
      } else {
        depensePG.push({
          order:PG.order,
          name:PG.nom,
          id:key,
          gratuit:PG.gratuit,
          value:PG.cout,
          isAutre:true
        });
      }
    }

    armesContactEquipee.sort(SortByName);
    armesContactRack.sort(SortByName);
    armesDistanceEquipee.sort(SortByName);
    armesDistanceRack.sort(SortByName);
    armesTourelles.sort(SortByName);
    avantage.sort(SortByName);
    inconvenient.sort(SortByName);
    avantageIA.sort(SortByName);
    inconvenientIA.sort(SortByName);
    langue.sort(SortByName);
    contact.sort(SortByName);
    depensePG.sort(SortByAddOrder);
    distinctions.sort(SortByName);

    for (let [key, XP] of Object.entries(depenseXP)){
      if(XP.nom !== undefined && XP.nom !== 'autre' && XP.nom !== 'capaciteheroique' && XP.nom !== '')
      {
        let aspect = '';

        switch(XP.nom) {
          case 'chair':
          case 'deplacement':
          case 'force':
          case 'endurance':
            aspect = 'chair';
            break;

          case 'bete':
          case 'hargne':
          case 'combat':
          case 'instinct':
            aspect = 'bete';
            break;

          case 'machine':
          case 'tir':
          case 'savoir':
          case 'technique':
            aspect = 'machine';
            break;

          case 'dame':
          case 'aura':
          case 'parole':
          case 'sangFroid':
            aspect = 'dame';
            break;

          case 'masque':
          case 'discretion':
          case 'dexterite':
          case 'perception':
            aspect = 'masque';
            break;
        }

        const aspectExist = aspectsUpdate?.[aspect] || false;

        if(!aspectExist) aspectsUpdate[aspect] = {};

        if(XP.nom !== 'chair' && XP.nom !== 'dame' && XP.nom !== 'machine' && XP.nom !== 'bete' && XP.nom !== 'masque') {
          const CLExist = aspectsUpdate?.[aspect]?.caracteristiques || false;
          const CExist = aspectsUpdate?.[aspect]?.caracteristiques?.[XP.nom] || false;
          const CBExist = aspectsUpdate?.[aspect]?.caracteristiques?.[XP.nom]?.bonus || false;

          if(!CLExist) aspectsUpdate[aspect].caracteristiques = {};
          if(!CExist) aspectsUpdate[aspect].caracteristiques[XP.nom] = {};
          if(!CBExist) aspectsUpdate[aspect].caracteristiques[XP.nom].bonus = [];

          aspectsUpdate[aspect].caracteristiques[XP.nom].bonus.push(XP.bonus);
        } else if(XP.nom === 'chair' || XP.nom === 'dame' || XP.nom === 'machine' || XP.nom === 'bete' || XP.nom === 'masque') {
          const ABExist = aspectsUpdate?.[aspect]?.bonus || false;

          if(!ABExist) aspectsUpdate[aspect].bonus = [];

          aspectsUpdate[aspect].bonus.push(XP.bonus);
        }
      }
    };

    for(let i = 0;i < armesContactEquipee.length;i++) {
      armesContactEquipee[i].system.degats.module = {};
      armesContactEquipee[i].system.degats.module.fixe = moduleBonusDgts.contact;
      armesContactEquipee[i].system.degats.module.variable = moduleBonusDgtsVariable.contact;

      armesContactEquipee[i].system.violence.module = {};
      armesContactEquipee[i].system.violence.module.fixe = moduleBonusViolence.contact;
      armesContactEquipee[i].system.violence.module.variable = moduleBonusViolenceVariable.contact;
    };

    for(let i = 0;i < armesDistanceEquipee.length;i++) {
      armesDistanceEquipee[i].system.degats.module = {};
      armesDistanceEquipee[i].system.degats.module.fixe = moduleBonusDgts.distance;
      armesDistanceEquipee[i].system.degats.module.variable = moduleBonusDgtsVariable.distance;

      armesDistanceEquipee[i].system.violence.module = {};
      armesDistanceEquipee[i].system.violence.module.fixe = moduleBonusViolence.distance;
      armesDistanceEquipee[i].system.violence.module.variable = moduleBonusViolenceVariable.distance;
    };

    for (let [key, grenade] of Object.entries(grenades)){
      const effetsRaw = grenade.effets.raw.concat(armorSpecialRaw);
      const effetsCustom = grenade.effets.custom.concat(armorSpecialCustom);

      grenades[key].effets.raw = [...new Set(effetsRaw)];
      grenades[key].effets.custom = [...new Set(effetsCustom)];
    };

    for (let [keyA, aspect] of Object.entries(aspectsUpdate)) {
      const caracteristiquesExist = aspect?.caracteristiques || false;
      const aspectsBonus = aspect?.bonus || false;
      const aspectsMalus = aspect?.malus || false;

      if(aspectsMalus !== false) aspects[keyA].malus = aspectsMalus.reduce(sum);
      if(aspectsBonus !== false) aspects[keyA].bonus = aspectsBonus.reduce(sum);

      if(caracteristiquesExist !== false) {
        for (let [keyC, carac] of Object.entries(aspect.caracteristiques)) {

          const cBonus = carac?.bonus || false;
          const cMalus = carac?.malus || false;
          const OD = carac?.overdrive || false;



          if(cBonus !== false) aspects[keyA].caracteristiques[keyC].bonus = cBonus.reduce(sum);
          if(cMalus !== false) aspects[keyA].caracteristiques[keyC].malus = cMalus.reduce(sum);

          if(OD !== false) {
            const oBase = OD?.base || false;
            const oBonus = OD?.bonus || false;
            const oMalus = OD?.malus || false;

            if(oBase !== false) aspects[keyA].caracteristiques[keyC].overdrive.base = Math.max(...oBase);
            if(oBonus !== false) aspects[keyA].caracteristiques[keyC].overdrive.bonus = oBonus.reduce(sum);
            if(oMalus !== false) aspects[keyA].caracteristiques[keyC].overdrive.malus = oMalus.reduce(sum);
          }
        }
      }

    };

    for (let [kAI, armesimprovisees] of Object.entries(system.combat.armesimprovisees.liste)) {
      for (let [key, arme] of Object.entries(armesimprovisees.liste)) {
        arme.effets.raw = armorSpecialRaw;
        arme.effets.custom = armorSpecialCustom;
      }
    };

    const hasCompanions = armureData?.system?.capacites?.selected?.companions || false;

    if(hasCompanions) {
      const lionCDF = +armureData.system.capacites.selected.companions.lion.champDeForce.base;
      const lionArmure = +armureData.system.capacites.selected.companions.lion.armure.base;
      const lionDefense = +armureData.system.capacites.selected.companions.lion.defense.base;
      const lionReaction = +armureData.system.capacites.selected.companions.lion.reaction.base;
      const lionEnergie = +armureData.system.capacites.selected.companions.lion.energie.base;
      const lionInitiativeB = +armureData.system.capacites.selected.companions.lion.initiative.value;

      armureData.system.capacites.selected.companions.lion.champDeForce.value = lionCDF+lion.champDeForce.bonus.reduce(sum)-lion.champDeForce.malus.reduce(sum);
      armureData.system.capacites.selected.companions.lion.champDeForce.bonus = lion.champDeForce.bonus;
      armureData.system.capacites.selected.companions.lion.champDeForce.malus = lion.champDeForce.malus;

      armureData.system.capacites.selected.companions.lion.armure.value = lionArmure+lion.armure.bonus.reduce(sum)-lion.armure.malus.reduce(sum);
      armureData.system.capacites.selected.companions.lion.armure.bonus = lion.armure.bonus;
      armureData.system.capacites.selected.companions.lion.armure.malus = lion.armure.malus;

      armureData.system.capacites.selected.companions.lion.defense.value = lionDefense+lion.defense.bonus.reduce(sum)-lion.defense.malus.reduce(sum);
      armureData.system.capacites.selected.companions.lion.defense.bonus = lion.defense.bonus;
      armureData.system.capacites.selected.companions.lion.defense.malus = lion.defense.malus;

      armureData.system.capacites.selected.companions.lion.reaction.value = lionReaction+lion.reaction.bonus.reduce(sum)-lion.reaction.malus.reduce(sum);
      armureData.system.capacites.selected.companions.lion.reaction.bonus = lion.reaction.bonus;
      armureData.system.capacites.selected.companions.lion.reaction.malus = lion.reaction.malus;

      armureData.system.capacites.selected.companions.lion.energie.value = lionEnergie+lion.energie.bonus.reduce(sum)-lion.energie.malus.reduce(sum);
      armureData.system.capacites.selected.companions.lion.energie.bonus = lion.energie.bonus;
      armureData.system.capacites.selected.companions.lion.energie.malus = lion.energie.malus;

      armureData.system.capacites.selected.companions.lion.initiative.total = lionInitiativeB+lion.energie.bonus.reduce(sum)-lion.energie.malus.reduce(sum);
      armureData.system.capacites.selected.companions.lion.initiative.bonus = lion.initiative.bonus;
      armureData.system.capacites.selected.companions.lion.initiative.malus = lion.initiative.malus;

      armureData.system.capacites.selected.companions.lion.bonusDgtsVariable = lion.bonusDgtsVariable;
      armureData.system.capacites.selected.companions.lion.bonusDgts = lion.bonusDgts;

      armureData.system.capacites.selected.companions.lion.bonusViolenceVariable = lion.bonusViolenceVariable;
      armureData.system.capacites.selected.companions.lion.bonusViolence = lion.bonusViolence;

      armureData.system.capacites.selected.companions.lion.modules = [];
      armureData.system.capacites.selected.companions.lion.modules = lion.modules;
    };

    if(capaciteultime) {
      const CUData = capaciteultime.system;

      if(CUData.type === 'active') {
        const CUAData = CUData.actives;

        if(CUAData.reaction > 0 || CUAData.defense > 0 ||
          CUAData.recuperation.PA || CUAData.recuperation.PS ||
          CUAData.recuperation.PE || (CUAData.jet.actif && CUAData.jet.isfixe) ||
          (CUAData.degats.actif && CUAData.degats.isfixe) ||
          (CUAData.violence.actif && CUAData.violence.isfixe) ||
          CUAData.effets.actif) CUData.actives.isActivable = true;
        else CUData.actives.isActivable = false;
      }
    }

    actorData.carteHeroique = carteHeroique;
    actorData.capaciteHeroique = capaciteHeroique;
    actorData.evolutionsCompanions = evolutionsCompanions;
    actorData.evolutionsAchetables = evolutionsAchetables;
    actorData.evolutionsAAcheter = evolutionsAAcheter;
    actorData.armureData = armureData;
    actorData.armureLegendeData = armureLegendeData;
    actorData.modules = module;
    actorData.modulespassifs = modulepassifs;
    actorData.moduleErsatz = moduleErsatz;
    actorData.avantages = avantage;
    actorData.inconvenient = inconvenient;
    actorData.avantagesIA = avantageIA;
    actorData.inconvenientIA = inconvenientIA;
    actorData.motivationMineure = motivationMineure;
    actorData.langue = langue;
    actorData.contact = contact;
    actorData.blessure = blessures;
    actorData.trauma = trauma;
    actorData.longbow = longbow;
    actorData.armesContactEquipee = armesContactEquipee;
    actorData.armesContactRack = armesContactRack;
    actorData.armesContactArmoury = armesContactArmoury;
    actorData.armesDistanceEquipee = armesDistanceEquipee;
    actorData.armesDistanceRack = armesDistanceRack;
    actorData.armesDistanceArmoury = armesDistanceArmoury;
    actorData.armesTourelles = armesTourelles;
    actorData.art = art;
    actorData.distinctions = distinctions;
    actorData.capaciteultime = capaciteultime;

    const update = {
      system:{
        sante:{
          bonus:{
            avantages:sante.bonus.avantages.reduce(sum)
          },
          malus:{
            desavantages:sante.malus.desavantages.reduce(sum)
          }
        },
        egide:{
          bonus:{
            armure:egide.bonus.armure.reduce(sum),
            distinction:egide.bonus.distinction.reduce(sum)
          }
        },
        espoir:{
          value:espoir.value,
          bonus:{
            avantages:espoir.bonus.avantages.reduce(sum),
            armure:espoir.bonus.armure.reduce(sum)
          },
          malus:{
            desavantages:espoir.malus.desavantages.reduce(sum),
            blessures:espoir.malus.blessures.reduce(sum)
          },
          recuperation:{
            aucun:espoir.aucun,
            bonus:espoir.recuperationBonus.reduce(sum),
            malus:espoir.recuperationMalus.reduce(sum)
          },
          perte:{
            malus:espoir.perteMalus.reduce(sum),
            saufAgonie:espoir.perte.saufAgonie,
            saufCapacite:espoir.perte.saufCapacite
          }
        },
        initiative:{
          diceBonus:{
            avantages:initiative.diceBonus.avantages.reduce(sum)
          },
          bonus:{
            avantages:initiative.bonus.avantages.reduce(sum)
          },
          diceMalus:{
            desavantages:initiative.diceMalus.desavantages.reduce(sum)
          },
          malus:{
            desavantages:initiative.malus.desavantages.reduce(sum)
          }
        },
        aspects,
        equipements:{
          ascension:{
            armure:{
              bonus:{
                modules:armure.bonus.modules.reduce(sum)
              }
            },
            champDeForce:{
              bonus:{
                modules:champDeForce.bonus.modules.reduce(sum),
                armes:champDeForce.bonus.armes
              }
            },
            energie:{
              bonus:{
                modules:energie.bonus.modules.reduce(sum)
              }
            }
          },
          armure:{
            armure:{
              bonus:{
                modules:armure.bonus.modules.reduce(sum)
              }
            },
            champDeForce:{
              bonus:{
                modules:champDeForce.bonus.modules.reduce(sum),
                armes:champDeForce.bonus.armes
              }
            },
            energie:{
              bonus:{
                modules:energie.bonus.modules.reduce(sum)
              }
            },
            slots:{
              tete:slots.tete,
              torse:slots.torse,
              brasGauche:slots.brasGauche,
              brasDroit:slots.brasDroit,
              jambeGauche:slots.jambeGauche,
              jambeDroite:slots.jambeDroite
            }
          }
        },
        combat:{
          nods:nods,
          grenades:{
            liste:grenades
          }
        },
        reaction:{
          bonus:{
            armes:reaction.bonus
          },
          malus:{
            armes:reaction.malus
          }
        },
        defense:{
          bonus:{
            armes:defense.bonus
          },
          malus:{
            armes:defense.malus
          }
        },
        progression:{
          gloire:{
            depense:{
              liste:depensePG
            }
          }
        },
        bonusSiEmbuscade:{
          bonusInitiative:{
            dice:bonusDiceEmbuscadeSubis,
            fixe:bonusFixeEmbuscadeSubis,
          }
        }
      }
    }

    this.actor.update(update);

    // ON ACTUALISE ROLL UI S'IL EST OUVERT
    let rollUi = Object.values(ui.windows).find((app) => app instanceof KnightRollDialog) ?? false;

    if(rollUi !== false) {
      const style = system.combat.style;
      const getStyle = getModStyle(style);
      let AvDv = {
        avantages:avantageIA,
        inconvenient:inconvenientIA
      };

      await rollUi.setWpnContact(armesContactEquipee);
      await rollUi.setWpnDistance(armesDistanceEquipee);
      await rollUi.setWpnTourelle(armesTourelles);
      await rollUi.setStyle({
        fulllabel:game.i18n.localize(`KNIGHT.COMBAT.STYLES.${style.toUpperCase()}.FullLabel`),
        label:game.i18n.localize(`KNIGHT.COMBAT.STYLES.${style.toUpperCase()}.Label`),
        raw:style,
        info:system.combat.styleInfo,
        caracteristiques:getStyle.caracteristiques,
        tourspasses:system.combat.data.tourspasses,
        type:system.combat.data.type,
        sacrifice:system.combat.data.sacrifice,
        maximum:6
      });
      await rollUi.addAvDv(AvDv);

      rollUi.render(true);
    }
  }

  async _prepareCapacitesParameters(context) {
    const remplaceEnergie = context.actor?.armureData?.system?.espoir?.remplaceEnergie || false;
    const eTotale = remplaceEnergie === false ? context.data.system.energie.max : context.data.system.espoir.max;
    const eActuel = remplaceEnergie === false ? context.data.system.energie.value : context.data.system.espoir.value;

    const capacites = context.data.system.equipements.armure.capacites;
    const warlord = context.actor?.armureData?.system?.capacites?.selected?.warlord || false;
    const warlordLegende = context.actor?.armureLegendeData?.system?.capacites?.selected?.warlord || false;
    const illumination = context.actor?.armureData?.system?.capacites?.selected?.illumination || false;
    const companions = context.actor?.armureData?.system?.capacites?.selected?.companions || false;
    const type = context.actor?.armureData?.system?.capacites?.selected?.type || false;
    const typeLegende = context.actor?.armureLegendeData?.system?.capacites?.selected?.type || false;
    const vision = context.actor?.armureData?.system?.capacites?.selected?.vision || false;

    const update = {
      system:{
        equipements:{
          armure:{
            capacites:{
              ascension:{},
              companions:{},
              warlord:{
                modes:{},
                action:{},
                guerre:{},
                force:{},
                esquive:{}
              }
            }
          }
        }
      }
    };

    if(warlord != false) {
      const cWarlord = warlord.impulsions;
      const cWarlordMax = cWarlord.selection;
      const cWarlordActuel = cWarlord?.selectionne || 0;

      if(cWarlordMax === cWarlordActuel) { cWarlord.choisi = true; }
      else { cWarlord.choisi = false; }
    }

    if(warlordLegende != false) {
      const cWarlordLegende = warlordLegende.impulsions;
      const cWarlordLegendeMax = cWarlordLegende.selection;
      const cWarlordLegendeActuel = cWarlordLegende?.selectionne || 0;

      if(cWarlordLegendeMax === cWarlordLegendeActuel) { cWarlordLegende.choisi = true; }
      else { cWarlordLegende.choisi = false; }
    }

    if(illumination != false) {
      if(illumination.selectionne === illumination.nbreCapacitesSelected) { illumination.choixFaits = true; }
      else { illumination.choixFaits = false; }
    }

    if(type != false) {
      if(type.selectionne === type.nbreType) { type.choixFaits = true; }
      else { type.choixFaits = false; }
    }

    if(typeLegende != false) {
      if(typeLegende.selectionne === typeLegende.nbreType) { typeLegende.choixFaits = true; }
      else { typeLegende.choixFaits = false; }
    }

    if(companions != false) {
      const cCompanions = capacites.companions;
      const energieDisponible = [];

      for(let i = 1;i <= eTotale/10;i++) {
        energieDisponible.push(i*10);
      }

      cCompanions.energieDisponible = energieDisponible;

      if(cCompanions.energie > eActuel) {
        update.system.equipements.armure.capacites.companions.energie = 0;

        this.actor.update(update);
      }
    }

    if(vision != false) {
      const aPE = capacites.vision.energie;
      const cPE = vision.energie.min;

      if(aPE < cPE) {
        capacites.vision.energie = cPE;
      }
    }
  }

  _prepareCapacitesTranslations(context) {
    this._prepareBorealisTranslation(context);
    this._prepareChangelingTranslation(context);
    this._prepareCompanionsTranslation(context);
    this._prepareCeaTranslation(context);
    this._prepareGhostTranslation(context);
    this._prepareGoliathTranslation(context);
    this._prepareIlluminationTranslation(context);
    this._prepareLongbowTranslation(context);
    this._prepareMorphTranslation(context);
    this._prepareOriflammeTranslation(context);

    this._prepareCompanionsLegendeTranslation(context);
    this._prepareGhostLegendeTranslation(context);
    this._prepareGoliathLegendeTranslation(context);
    this._prepareOriflammeLegendeTranslation(context);
  }

  _prepareBorealisTranslation(context) {
    const capacite = context.actor?.armureData?.system?.capacites?.selected?.borealis || false;
    if(capacite === false) return;

    const bRaw = capacite.offensif.effets.raw;
    const bCustom = capacite.offensif.effets.custom;
    const labels = CONFIG.KNIGHT.effets;

    capacite.offensif.effets.liste = listEffects(bRaw, bCustom, labels);
  }

  _prepareChangelingTranslation(context) {
    const capacite = context.actor?.armureData?.system?.capacites?.selected?.changeling || false;
    if(capacite === false) return;

    const bRaw = capacite.desactivationexplosive.effets.raw;
    const bCustom = capacite.desactivationexplosive.effets.custom;
    const labels = CONFIG.KNIGHT.effets;

    capacite.desactivationexplosive.effets.liste = listEffects(bRaw, bCustom, labels);
  }

  _prepareCompanionsTranslation(context) {
    const companions = context.actor?.armureData?.system?.capacites.selected?.companions;
    const lEffets = companions?.lion?.armes || false;
    const wEffets = companions?.wolf?.armes || false;
    const bEffets = companions?.wolf?.configurations?.fighter?.bonus?.effets || false;

    if(!companions) return;

    const labels = CONFIG.KNIGHT.effets;


    if(lEffets != false) {
      const cLEffets = lEffets.contact.coups.effets;
      const cLRaw = cLEffets.raw;
      const cLCustom = cLEffets.custom;

      cLEffets.liste = listEffects(cLRaw, cLCustom, labels);
    }

    if(wEffets != false) {
      const cWEffets = wEffets.contact.coups.effets;
      const cWRaw = cWEffets.raw;
      const CWCustom = cWEffets.custom;

      cWEffets.liste = listEffects(cWRaw, CWCustom, labels);
    }

    if(bEffets != false) {
      const raw = bEffets.raw;
      const custom = bEffets.custom;

      bEffets.liste = listEffects(raw, custom, labels);
    }
  }

  _prepareCompanionsLegendeTranslation(context) {
    const companions = context.actor?.armureLegendeData?.system?.capacites.selected?.companions;
    const lEffets = companions?.lion?.armes || false;
    const wEffets = companions?.wolf?.armes || false;
    const bEffets = companions?.wolf?.configurations?.fighter?.bonus?.effets || false;

    if(!companions) return;

    const labels = CONFIG.KNIGHT.effets;


    if(lEffets != false) {
      const cLEffets = lEffets.contact.coups.effets;
      const cLRaw = cLEffets.raw;
      const cLCustom = cLEffets.custom;

      cLEffets.liste = listEffects(cLRaw, cLCustom, labels);
    }

    if(wEffets != false) {
      const cWEffets = wEffets.contact.coups.effets;
      const cWRaw = cWEffets.raw;
      const CWCustom = cWEffets.custom;

      cWEffets.liste = listEffects(cWRaw, CWCustom, labels);
    }

    if(bEffets != false) {
      const raw = bEffets.raw;
      const custom = bEffets.custom;

      bEffets.liste = listEffects(raw, custom, labels);
    }
  }

  _prepareCeaTranslation(context) {
    const capacite = context.actor?.armureData?.system?.capacites?.selected?.cea || false;
    if(capacite === false) return;

    const bSRaw = capacite.salve.effets.raw;
    const bSCustom = capacite.salve.effets.custom;
    const bVRaw = capacite.vague.effets.raw;
    const bVCustom = capacite.vague.effets.custom;
    const bRRaw = capacite.rayon.effets.raw;
    const bRCustom = capacite.rayon.effets.custom;
    const labels = CONFIG.KNIGHT.effets;

    capacite.salve.effets.liste = listEffects(bSRaw, bSCustom, labels);
    capacite.vague.effets.liste = listEffects(bVRaw, bVCustom, labels);
    capacite.rayon.effets.liste = listEffects(bRRaw, bRCustom, labels);
  }

  _prepareGhostTranslation(context) {
    const capacite = context.actor?.armureData?.system?.capacites?.selected?.ghost || false;
    if(capacite === false) return;

    const bonus = capacite.bonus.degats;
    const inclus = bonus.inclus;

    const odInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["odinclus"]);
    const odNoInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["odnoinclus"]);

    const diceInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["diceinclus"]);
    const diceNoInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["dicenoinclus"]);

    const fixeInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["fixeinclus"]);
    const fixeNoInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["fixenoinclus"]);

    if(bonus.dice === true) { inclus.dice = diceInclus; }
    else { inclus.dice = diceNoInclus; }

    if(bonus.fixe === true) { inclus.fixe = fixeInclus; }
    else { inclus.fixe = fixeNoInclus; }

    if(bonus.od === true) { inclus.od = odInclus; }
    else { inclus.od = odNoInclus; }
  }

  _prepareGhostLegendeTranslation(context) {
    const capacite = context.actor?.armureLegendeData?.system?.capacites?.selected?.ghost || false;
    if(capacite === false) return;

    const bonus = capacite.bonus.degats;
    const inclus = bonus.inclus;

    const odInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["odinclus"]);
    const odNoInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["odnoinclus"]);

    const diceInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["diceinclus"]);
    const diceNoInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["dicenoinclus"]);

    const fixeInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["fixeinclus"]);
    const fixeNoInclus = game.i18n.localize(CONFIG.KNIGHT.ghost["fixenoinclus"]);

    if(bonus.dice === true) { inclus.dice = diceInclus; }
    else { inclus.dice = diceNoInclus; }

    if(bonus.fixe === true) { inclus.fixe = fixeInclus; }
    else { inclus.fixe = fixeNoInclus; }

    if(bonus.od === true) { inclus.od = odInclus; }
    else { inclus.od = odNoInclus; }
  }

  _prepareGoliathTranslation(context) {
    const capacite = context.actor?.armureData?.system?.capacites?.selected?.goliath?.armesRack || false;
    if(capacite === false) return;

    if(capacite.active) {
      capacite.label = game.i18n.localize(CONFIG.KNIGHT.goliath["armesrack"])+" "+capacite.value+" "+game.i18n.localize(CONFIG.KNIGHT.goliath["metrebonus"]).toLowerCase();
    } else {
      capacite.label = game.i18n.localize(CONFIG.KNIGHT.goliath["armesnorack"]);
    }
  }

  _prepareGoliathLegendeTranslation(context) {
    const capacite = context.actor?.armureLegendeData?.system?.capacites?.selected?.goliath?.armesRack || false;
    if(capacite === false) return;

    if(capacite.active) {
      capacite.label = game.i18n.localize(CONFIG.KNIGHT.goliath["armesrack"])+" "+capacite.value+" "+game.i18n.localize(CONFIG.KNIGHT.goliath["metrebonus"]).toLowerCase();
    } else {
      capacite.label = game.i18n.localize(CONFIG.KNIGHT.goliath["armesnorack"]);
    }
  }

  _prepareIlluminationTranslation(context) {
    const capacite = context.actor?.armureData?.system?.capacites?.selected?.illumination || false;
    if(capacite === false) return;

    const beacon = capacite.beacon;
    const candle = capacite.candle;
    const torch = capacite.torch;
    const lighthouse = capacite.lighthouse;
    const lantern = capacite.lantern;
    const blaze = capacite.blaze;
    const projector = capacite.projector;

    beacon.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.beacon.portee.charAt(0).toUpperCase()+capacite.beacon.portee.substr(1)}`);
    candle.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.candle.portee.charAt(0).toUpperCase()+capacite.candle.portee.substr(1)}`);
    torch.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.torch.portee.charAt(0).toUpperCase()+capacite.torch.portee.substr(1)}`);
    lighthouse.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.lighthouse.portee.charAt(0).toUpperCase()+capacite.lighthouse.portee.substr(1)}`);
    lantern.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.lantern.portee.charAt(0).toUpperCase()+capacite.lantern.portee.substr(1)}`);
    blaze.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.blaze.portee.charAt(0).toUpperCase()+capacite.blaze.portee.substr(1)}`);
    projector.labelPortee = game.i18n.localize(`KNIGHT.PORTEE.${capacite.projector.portee.charAt(0).toUpperCase()+capacite.projector.portee.substr(1)}`);

    const raw = lantern.effets.raw;
    const custom = lantern.effets.custom;
    const labels = CONFIG.KNIGHT.effets;

    lantern.effets.liste = listEffects(raw, custom, labels);
  }

  _prepareLongbowTranslation(context) {
    const longbow = context.actor?.armureData?.system?.capacites?.selected?.longbow || false;

    if(longbow === false) return;

    const effets = longbow.effets;

    const lEB = effets.base;
    const lRB = lEB.raw;
    const lCB = lEB.custom;

    const lE1 = effets.liste1;
    const lR1 = lE1.raw;
    const lC1 = lE1.custom;

    const lE2 = effets.liste2;
    const lR2 = lE2.raw;
    const lC2 = lE2.custom;

    const lE3 = effets.liste3;
    const lR3 = lE3.raw;
    const lC3 = lE3.custom;

    const lA = longbow?.distance || {raw:[], custom:[]};
    const lRA = lA.raw;
    const lCA = lA.custom;

    const lEffets3 = lE3.acces;

    const labels = CONFIG.KNIGHT.effets;
    const labelsA = CONFIG.KNIGHT.AMELIORATIONS.distance;

    lEB.liste = listEffects(lRB, lCB, labels);
    lE1.liste = listEffects(lR1, lC1, labels);
    lE2.liste = listEffects(lR2, lC2, labels);
    lE3.liste = listEffects(lR3, lC3, labels);
    lA.liste = listEffects(lRA, lCA, labelsA);

    if(lEffets3) {
      lE3.label = game.i18n.localize(CONFIG.KNIGHT.longbow["effets3"]);
    } else {
      lE3.label = game.i18n.localize(CONFIG.KNIGHT.longbow["noeffets3"]);
    }
  }

  _prepareMorphTranslation(context) {
    const morph = context.actor?.armureData?.system?.capacites?.selected?.morph || false;

    if(morph === false) return;

    const effetsG = morph.polymorphie.griffe.effets;
    const rawG = effetsG.raw;
    const customG = effetsG.custom;
    const labels = CONFIG.KNIGHT.effets;

    const effetsL = morph.polymorphie.lame.effets;
    const rawL = effetsL.raw;
    const customL = effetsL.custom;

    const effetsC = morph.polymorphie.canon.effets;
    const rawC = effetsC.raw;
    const customC = effetsC.custom;

    effetsG.liste = listEffects(rawG, customG, labels);
    effetsL.liste = listEffects(rawL, customL, labels);
    effetsC.liste = listEffects(rawC, customC, labels);
  }

  _prepareOriflammeTranslation(context) {
    const oriflamme = context.actor?.armureData?.system?.capacites?.selected?.oriflamme || false;

    if(oriflamme === false) return;

    const effets = oriflamme.effets;
    const raw = effets.raw;
    const custom = effets.custom;
    const labels = CONFIG.KNIGHT.effets;

    effets.liste = listEffects(raw, custom, labels);
  }

  _prepareOriflammeLegendeTranslation(context) {
    const oriflamme = context.actor?.armureLegendeData?.system?.capacites?.selected?.oriflamme || false;

    if(oriflamme === false) return;

    const effets = oriflamme.effets;
    const raw = effets.raw;
    const custom = effets.custom;
    const labels = CONFIG.KNIGHT.effets;

    effets.liste = listEffects(raw, custom, labels);
  }

  _prepareSpecialTranslations(context) {
    this._prepareContrecoupsTranslation(context);
    this._preparePorteurLumiereTranslation(context);
  }

  _prepareContrecoupsTranslation(context) {
    const contrecoups = context.actor?.armureData?.system?.special?.selected?.contrecoups || false;

    if(contrecoups === false) return;

    const relance = contrecoups.relance.value;

    if(relance) {
      contrecoups.relance.label = game.i18n.localize(CONFIG.KNIGHT.contrecoups["relance"]);
    } else {
      contrecoups.relance.label = game.i18n.localize(CONFIG.KNIGHT.contrecoups["norelance"]);
    }

    const maxeffets = contrecoups.maxeffets.value;

    if(maxeffets) {
      contrecoups.maxeffets.label = game.i18n.localize(CONFIG.KNIGHT.contrecoups["maxeffets"]);
    } else {
      contrecoups.maxeffets.label = game.i18n.localize(CONFIG.KNIGHT.contrecoups["nomaxeffets"]);
    }

    const armedistance = contrecoups.armedistance.value;

    if(armedistance) {
      contrecoups.armedistance.label = game.i18n.localize(CONFIG.KNIGHT.contrecoups["armedistance"]);
    } else {
      contrecoups.armedistance.label = game.i18n.localize(CONFIG.KNIGHT.contrecoups["noarmedistance"]);
    }
  }

  _preparePorteurLumiereTranslation(context) {
    const porteurlumiere = context.actor?.armureData?.system?.special?.selected?.porteurlumiere || false;

    if(porteurlumiere === false) return;

    const ePorteur = porteurlumiere.bonus.effets;
    const labelsE = CONFIG.KNIGHT.effets;

    ePorteur.liste = listEffects(ePorteur.raw, ePorteur.custom, labelsE);
  }

  _prepareModuleTranslation(context) {
    const modules = context.actor?.modules || false;

    if(modules === false) return;

    for (let [key, module] of Object.entries(modules)) {
      const raw = module.system.arme.effets.raw;
      const custom = module.system.arme.effets.custom;
      const labels = CONFIG.KNIGHT.effets;

      const rawD = module.system.arme.distance.raw;
      const customD = module.system.arme.distance.custom;
      const labelsD = CONFIG.KNIGHT.AMELIORATIONS.distance;

      const rawS = module.system.arme.structurelles.raw;
      const customS = module.system.arme.structurelles.custom;
      const labelsS = CONFIG.KNIGHT.AMELIORATIONS.structurelles;

      const rawO = module.system.arme.ornementales.raw;
      const customO = module.system.arme.ornementales.custom;
      const labelsO = CONFIG.KNIGHT.AMELIORATIONS.ornementales;

      const rawM = module.system.jetsimple.effets.raw;
      const customM = module.system.jetsimple.effets.custom;

      module.system.jetsimple.effets.liste = listEffects(rawM, customM, labels);
      module.system.arme.effets.liste = listEffects(raw, custom, labels);
      module.system.arme.distance.liste = listEffects(rawD, customD, labelsD);
      module.system.arme.structurelles.liste = listEffects(rawS, customS, labelsS);
      module.system.arme.ornementales.liste = listEffects(rawO, customO, labelsO);

      const pnj = module.system.pnj.liste;

      for (let [kNpc, npc] of Object.entries(pnj)) {
        if(npc.armes.has) {
          const armes = npc.armes.liste;

          for (let [kArme, arme] of Object.entries(armes)) {
            const rArme = arme.effets.raw;
            const cArme = arme.effets.custom;

            arme.effets.liste = listEffects(rArme, cArme, labels);
          }
        }
      }
    }
  }

  _prepareWpnEffets(context) {
    const aCEEffets = context.actor?.armesContactEquipee || false;
    const aDEEffets = context.actor?.armesDistanceEquipee || false;
    const aCEffets = context.actor?.armesContactRack || false;
    const aDEffets = context.actor?.armesDistanceRack || false;
    const aCAEffets = context.actor?.armesContactArmoury || false;
    const aDAEffets = context.actor?.armesDistanceArmoury || false;
    const aTEffets = context.actor?.armesTourelles || false;

    const labelsE = CONFIG.KNIGHT.effets;
    const labelsD = CONFIG.KNIGHT.AMELIORATIONS.distance;
    const labelsS = CONFIG.KNIGHT.AMELIORATIONS.structurelles;
    const labelsO = CONFIG.KNIGHT.AMELIORATIONS.ornementales;


    if(aCEffets !== false) {
      for (let [key, effets] of Object.entries(aCEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];
        const effet2mains = effets.system?.effets2mains || false;
        const bRaw2 = effets.system?.effets2mains?.raw || [];
        const bCustom2 = effets.system?.effets2mains?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);

        if(effet2mains !== false) {
          effet2mains.liste = listEffects(bRaw2, bCustom2, labelsE);
        }

        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);
      };
    }

    if(aDEffets !== false) {
      for (let [key, effets] of Object.entries(aDEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);
        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);

        const effetMunition = effets.system?.optionsmunitions?.liste || false;

        for (let [kM, munition] of Object.entries(effetMunition)) {
          const bRaw2 = munition.raw || [];
          const bCustom2 = munition.custom || [];

          munition.liste = listEffects(bRaw2, bCustom2, labelsE);
        }
      };

    }

    if(aCEEffets !== false) {
      for (let [key, effets] of Object.entries(aCEEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];
        const effet2mains = effets.system?.effets2mains || false;
        const bRaw2 = effets.system?.effets2mains?.raw || [];
        const bCustom2 = effets.system?.effets2mains?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);

        if(effet2mains !== false) {
          effet2mains.liste = listEffects(bRaw2, bCustom2, labelsE);
        }

        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);
      };
    }

    if(aDEEffets !== false) {
      for (let [key, effets] of Object.entries(aDEEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);
        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);

        const effetMunition = effets.system?.optionsmunitions?.liste || false;

        for (let [kM, munition] of Object.entries(effetMunition)) {
          const bRaw2 = munition.raw || [];
          const bCustom2 = munition.custom || [];

          munition.liste = listEffects(bRaw2, bCustom2, labelsE);
        }
      };

    }

    if(aCAEffets !== false) {
      for (let [key, effets] of Object.entries(aCAEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];
        const effet2mains = effets.system?.effets2mains || false;
        const bRaw2 = effets.system?.effets2mains?.raw || [];
        const bCustom2 = effets.system?.effets2mains?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);

        if(effet2mains !== false) {
          effet2mains.liste = listEffects(bRaw2, bCustom2, labelsE);
        }

        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);
      };
    }

    if(aDAEffets !== false) {
      for (let [key, effets] of Object.entries(aDAEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);
        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);

        const effetMunition = effets.system?.optionsmunitions?.liste || false;

        for (let [kM, munition] of Object.entries(effetMunition)) {
          const bRaw2 = munition.raw || [];
          const bCustom2 = munition.custom || [];

          munition.liste = listEffects(bRaw2, bCustom2, labelsE);
        }
      };
    }

    if(aTEffets !== false) {
      for (let [key, effets] of Object.entries(aTEffets)) {
        const bRaw = effets.system?.effets?.raw || [];
        const bCustom = effets.system?.effets?.custom || [];

        const bRDistance = effets.system?.distance?.raw || [];
        const bCDistance = effets.system?.distance?.custom || [];

        const bRStructurelles = effets.system?.structurelles?.raw || [];
        const bCStructurelles = effets.system?.structurelles?.custom || [];

        const bROrnementales = effets.system?.ornementales?.raw || [];
        const bCOrnementales = effets.system?.ornementales?.custom || [];

        effets.system.effets.liste = listEffects(bRaw, bCustom, labelsE);
        if(bRDistance.length !== 0) effets.system.distance.liste = listEffects(bRDistance, bCDistance, labelsD);
        if(bRStructurelles.length !== 0) effets.system.structurelles.liste = listEffects(bRStructurelles, bCStructurelles, labelsS);
        if(bROrnementales.length !== 0) effets.system.ornementales.liste = listEffects(bROrnementales, bCOrnementales, labelsO);

        const effetMunition = effets.system?.optionsmunitions?.liste || false;

        for (let [kM, munition] of Object.entries(effetMunition)) {
          const bRaw2 = munition.raw || [];
          const bCustom2 = munition.custom || [];

          munition.liste = listEffects(bRaw2, bCustom2, labelsE);
        }
      };
    }
  }

  _prepareOverdrives(aspect, name, data, context) {
    const actor = context.actor?.overdrives || false;
    const aspects = context.actor?.overdrives?.[aspect] || false;
    const OD = data.overdrive.value;

    if(!actor) context.actor.overdrives = {};

    let result = {};

    for(let i = 1;i <= OD;i++) {
      const string = `KNIGHT.ASPECTS.${aspect.toUpperCase()}.CARACTERISTIQUES.${name.toUpperCase()}.OD${i}`;
      const translation = game.i18n.localize(string);
      const listExist = result?.liste || false;

      if(translation !== string) {
        if(!listExist) result.liste = {};
        result.liste[`OD${i}`] = {};
        result.liste[`OD${i}`].value = i;
        result.liste[`OD${i}`].description = translation;
      }
    }

    const length = Object.keys(result).length;

    if(length > 0) {
      result['OD'] = game.i18n.localize(`KNIGHT.ASPECTS.${aspect.toUpperCase()}.CARACTERISTIQUES.${name.toUpperCase()}.OD`);

      if(!aspects) context.actor.overdrives[aspect] = {};
      context.actor.overdrives[aspect][name] = result;
    }
  }

  _maxValue(sheetData) {
    const data = sheetData.data.system;
    const list = [`sante`, `espoir`];

    for(let i = 0;i < list.length;i++) {
      const dataBase = data[list[i]];

      if(dataBase.value > dataBase.max) { dataBase.value = dataBase.max; }
    }
  }

  async _depensePE(label, depense, autosubstract=true, forceEspoir=false, flux=false, capacite=true) {
    const data = this.getData();
    const armorId = data.systemData.equipements.armure.id;
    const getArmor = this.actor.items.get(armorId).system;
    const remplaceEnergie = getArmor.espoir.remplaceEnergie || false;

    const type = remplaceEnergie === true || forceEspoir === true ? 'espoir' : 'energie';
    const hasFlux = +data.systemData.jauges.flux;
    const fluxActuel = +data.systemData.flux.value;
    const actuel = remplaceEnergie === true || forceEspoir === true ? +data.systemData.espoir.value : +data.systemData.energie.value;
    const substract = actuel-depense;
    const hasJauge = data.systemData.jauges[type];

    if(!hasJauge) return false;

    if(flux != false && hasFlux) {
      if(fluxActuel < flux) { return false; }
    }

    if(substract < 0) {
      const lNot = remplaceEnergie ? game.i18n.localize('KNIGHT.JETS.Notespoir') : game.i18n.localize('KNIGHT.JETS.Notenergie');

      const msgEnergie = {
        flavor:`${label}`,
        main:{
          total:`${lNot}`
        }
      };

      const msgEnergieData = {
        user: game.user.id,
        speaker: {
          actor: this.actor?.id || null,
          token: this.actor?.token?.id || null,
          alias: this.actor?.name || null,
        },
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: await renderTemplate('systems/knight/templates/dices/wpn.html', msgEnergie),
        sound: CONFIG.sounds.dice
      };

      const rMode = game.settings.get("core", "rollMode");
      const msgFData = ChatMessage.applyRollMode(msgEnergieData, rMode);

      await ChatMessage.create(msgFData, {
        rollMode:rMode
      });

      return false;
    } else {

      if(autosubstract) {
        let update = {
          system:{
            [type]:{
              value:substract
            }
          }
        }

        if(flux != false) {
          update.system.flux = {};
          update.system.flux.value = fluxActuel-flux;
        }

        if(type === 'espoir' && this.getData().systemData.espoir.perte.saufAgonie && capacite === true) {
          update.system.espoir.value = actuel;
        }

        this.actor.update(update);
      }

      return true;
    }
  }

  _gainPE(gain, autoadd=true, forceEspoir=false) {
    const data = this.getData();
    const remplaceEnergie = this.actor.items.get(data.systemData.equipements.armure.id).system.espoir.remplaceEnergie || false;

    const type = remplaceEnergie === true || forceEspoir === true ? 'espoir' : 'energie';
    const actuel = remplaceEnergie === true || forceEspoir === true ? +data.systemData.espoir.value : +data.systemData.energie.value;
    const total = remplaceEnergie === true || forceEspoir === true ? +data.systemData.espoir.max : +data.systemData.energie.max;
    let add = actuel+gain;

    if(add > total) {
      add = total;
    }

    if(autoadd) {
      let update = {
        system:{
          [type]:{
            value:add
          }
        }
      }

      this.actor.update(update);
    }

    return true;
  }

  _updatePA(update) {
    const add = +update;
    const wear = this.object.system.wear;

    let itemUpdate = ``;
    let maj = {}

    switch(wear) {
      case 'armure':
        itemUpdate = `system.armure.value`;

        this.actor.items.get(this._getArmorId()).update({[itemUpdate]:add});
        break;

      case 'ascension':
      case 'guardian':
        maj = {
          'system':{
            'equipements':{
              [wear]:{
                'value':add
              }
            }
          }
        };

        this.actor.update(maj);
        break;
    }
  }

  _getCaracValue(c) {
    return +this.getData().actor.caracteristiques[c].value;
  }

  _getODValue(c) {
    const wear = this.getData().data.system.wear;
    let result = 0;

    if(wear === 'armure' || wear === 'ascension') { result = +this.getData().actor.caracteristiques[c].od; }

    return result;
  }

  _setCombos(aspects, toAdd = [], toLock = []) {
    const lAspectsInterdits = this.getData().data.system.combos.interdits.aspects;
    const lCaracsInterdits = this.getData().data.system.combos.interdits.caracteristiques;
    const lAspectsBonus = this.getData().data.system.combos.bonus.aspects;
    const lCaracsBonus = foundry.utils.mergeObject(this.getData().data.system.combos.bonus.caracteristiques, {add:toAdd});
    let interdits = [];
    let bonus = [];
    let lock = [];

    for (let [key, interdit] of Object.entries(lAspectsInterdits)){
      interdits = interdits.concat(interdit);
    }

    for (let [key, interdit] of Object.entries(lCaracsInterdits)){
      interdits = interdits.concat(interdit);
    }

    for (let [key, add] of Object.entries(lAspectsBonus)){
      for(let i = 0; i < add.length;i++) {
        if(!interdits.includes(add[i])) {
          bonus.push(add[i]);
        }
      }
    }

    for (let [key, add] of Object.entries(lCaracsBonus)){
      for(let i = 0; i < add.length;i++) {
        if(!interdits.includes(add[i])) {
          bonus.push(add[i]);
        }
      }
    }

    for (let [kAspect, aspect] of Object.entries(aspects)){
      if(interdits.includes(kAspect)) {
        delete aspects[kAspect];
      }

      for (let [kCaracs, carac] of Object.entries(aspect.caracteristiques)){
        if(bonus.includes(kCaracs)) {
          aspects[kAspect].caracteristiques[kCaracs].lock = false;
          bonus.push(kCaracs);
        }

        if(toLock.includes(kCaracs)) {
          aspects[kAspect].caracteristiques[kCaracs].lock = true;
          lock.push(kCaracs);
        }

        if(interdits.includes(kCaracs)) {
          delete aspects[kAspect].caracteristiques[kCaracs];
        }
      }
    }

    bonus = [...new Set(bonus)];
    lock = [...new Set(lock)];
    interdits = [...new Set(interdits)];

    const result = {
      aspects,
      bonus,
      interdits,
      lock
    };

    return result;
  }

  _getKnightRoll() {
    const result = Object.values(ui.windows).find((app) => app instanceof KnightRollDialog) ?? new game.knight.applications.KnightRollDialog({
      title:this.actor.name+" : "+game.i18n.localize("KNIGHT.JETS.Label"),
      buttons: {
        button1: {
          label: game.i18n.localize("KNIGHT.JETS.JetNormal"),
          callback: async () => {},
          icon: `<i class="fas fa-dice"></i>`
        },
        button2: {
          label: game.i18n.localize("KNIGHT.JETS.JetEntraide"),
          callback: async () => {},
          icon: `<i class="fas fa-dice-d6"></i>`
        },
        button3: {
          label: game.i18n.localize("KNIGHT.AUTRE.Annuler"),
          icon: `<i class="fas fa-times"></i>`
        }
      }
    });

    return result;
  }

  async _rollDice(label, caracteristique, difficulte = false, toAdd = [], toLock = [], isWpn = false, idWpn = '', nameWpn = '', typeWpn = '', num=-1, reussitesBonus=0, noOd=false) {
    const data = this.getData();
    const rollApp = this._getKnightRoll();
    const mCombos = this._setCombos(data.data.system.aspects, toAdd, toLock);
    const select = mCombos.bonus.includes(caracteristique) || mCombos.interdits.includes(caracteristique) ? '' : caracteristique;
    const aspects = mCombos.aspects;
    const bonus = mCombos.bonus;
    const style = data.systemData.combat.style;
    const getStyle = getModStyle(style);
    const deployWpnImproviseesDistance = typeWpn === 'armesimprovisees' && idWpn === 'distance' ? true : false;
    const deployWpnImproviseesContact = typeWpn === 'armesimprovisees' && idWpn === 'contact' ? true : false;
    const deployWpnDistance = typeWpn === 'distance' ? true : false;
    const deployWpnTourelle = typeWpn === 'tourelle' ? true : false;
    const deployWpnContact = typeWpn === 'contact' ? true : false;
    const deployGrenades = typeWpn === 'grenades' ? true : false;
    const deployLongbow = typeWpn === 'longbow' ? true : false;
    const hasBarrage = typeWpn === 'grenades' ? data.data.system.combat.grenades.liste[nameWpn].effets.raw.find(str => { if(str.includes('barrage')) return true; }) : false;
    const rBonus = reussitesBonus === 0 ? data.data.system.combat.data.succesbonus : reussitesBonus;
    let base = select === '' ? bonus[0] : caracteristique;

    if(base === undefined) {base = '';}

    if(select === '') { bonus.shift(); }

    let armeDistanceEquipee = data.actor.armesDistanceEquipee;
    let armeTourelle = data.actor.armesTourelles;

    for(let i = 0;i < Object.entries(armeDistanceEquipee).length;i++) {
      const wpnData = armeDistanceEquipee[i].system;
      const wpnMunitions = wpnData?.optionsmunitions || {has:false};
      const wpnMunitionActuel = wpnMunitions?.actuel || "";
      const wpnMunitionsListe = wpnMunitions?.liste?.[wpnMunitionActuel] || {};

      if(wpnMunitions.has) {
        const eRaw = wpnData.effets.raw.concat(wpnMunitionsListe.raw);
        const eCustom = wpnData.effets.custom.concat(wpnMunitionsListe.custom);

        armeDistanceEquipee[i].system.effets = {
          raw:[...new Set(eRaw)],
          custom:[...new Set(eCustom)],
        }
      }
    }

    for(let i = 0;i < Object.entries(armeTourelle).length;i++) {
      const wpnData = armeTourelle[i].system;
      const wpnMunitions = wpnData?.optionsmunitions || {has:false};
      const wpnMunitionActuel = wpnMunitions?.actuel || "";
      const wpnMunitionsListe = wpnMunitions?.liste?.[wpnMunitionActuel] || {};

      if(wpnMunitions.has) {
        const eRaw = wpnData.effets.raw.concat(wpnMunitionsListe.raw);
        const eCustom = wpnData.effets.custom.concat(wpnMunitionsListe.custom);

        armeTourelle[i].system.effets = {
          raw:[...new Set(eRaw)],
          custom:[...new Set(eCustom)],
        }
      }
    }

    let AvDv = {
      avantages:data.actor.avantagesIA,
      inconvenient:data.actor.inconvenientIA
    };

    await rollApp.setActor(this.actor.id);
    await rollApp.setAspects(aspects);
    await rollApp.setEffets(hasBarrage, true, true, true);
    await rollApp.setStyle({
      fulllabel:game.i18n.localize(`KNIGHT.COMBAT.STYLES.${style.toUpperCase()}.FullLabel`),
      label:game.i18n.localize(`KNIGHT.COMBAT.STYLES.${style.toUpperCase()}.Label`),
      raw:style,
      info:data.systemData.combat.styleInfo,
      caracteristiques:getStyle.caracteristiques,
      tourspasses:data.data.system.combat.data.tourspasses,
      type:data.data.system.combat.data.type,
      sacrifice:data.data.system.combat.data.sacrifice,
      maximum:6
    });
    await rollApp.setData(label, select, bonus, mCombos.lock, difficulte,
      data.data.system.combat.data.modificateur, rBonus,
      {dice:data.data.system.combat.data.degatsbonus.dice, fixe:data.data.system.combat.data.degatsbonus.fixe},
      {dice:data.data.system.combat.data.violencebonus.dice, fixe:data.data.system.combat.data.violencebonus.fixe},
      data.actor.armesContactEquipee, armeDistanceEquipee, armeTourelle, data.systemData.combat.grenades.liste, {contact:data.systemData.combat.armesimprovisees.liste, distance:data.systemData.combat.armesimprovisees.liste}, [], data.actor.longbow,
      isWpn, idWpn, nameWpn, typeWpn, num,
      deployWpnContact, deployWpnDistance, deployWpnTourelle, deployWpnImproviseesContact, deployWpnImproviseesDistance, deployGrenades, deployLongbow, false,
      false, false);
    await rollApp.setIfOd(noOd);
    await rollApp.addAvDv(AvDv);

    rollApp.render(true);
  }

  async _resetArmureCapacites() {
    const data = this.getData();
    const idArmure = data.systemData.equipements?.armure?.id || false;

    if(!idArmure) return;

    const armure = this.actor.items.get(this._getArmorId());
    const armorCapacites = armure.system.capacites.selected;
    const capaciteCompanions = armorCapacites?.companions || false;
    const capacites = {
      system:{
        equipements:{
          armure:{
            champDeForce:{
              bonus:{}
            },
            capacites:{
              ascension:{},
              borealis:{},
              changeling:{},
              companions:{},
              shrine:{},
              ghost:{},
              goliath:{},
              illumination:{},
              morph:{},
              rage:{
                niveau:{}
              },
              warlord:{
                action:{},
                guerre:{},
                force:{},
                esquive:{}
              },
              type:{
                soldier:{},
                hunter:{},
                scholar:{},
                herald:{},
                scout:{},
              }
            }
          }
        },
        reaction:{
          bonus:{},
          malus:{}
        },
        defense:{
          bonus:{},
          malus:{}
        },
        egide:{
          bonus:{},
          malus:{}
        },
        combos:{
          interdits:{
            aspects:{},
            caracteristiques:{}
          },
          bonus:{
            aspects:{},
            caracteristiques:{}
          }
        },
        aspects:{
          chair:{
            caracteristiques:{
              deplacement:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              force:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              endurance:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              }
            }
          },
          bete:{
            caracteristiques:{
              hargne:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              combat:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              instinct:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              }
            }
          },
          machine:{
            caracteristiques:{
              tir:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              savoir:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              technique:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              }
            }
          },
          dame:{
            caracteristiques:{
              aura:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              parole:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              sangFroid:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              }
            }
          },
          masque:{
            caracteristiques:{
              discretion:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              dexterite:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              },
              perception:{
                overdrive:{
                  bonus:{},
                  malus:{}
                }
              }
            }
          }
        },
        energie:{
          malus:{
            companions:0
          }
        },
        espoir:{
          malus:{
            companions:0
          }
        }
      }
    }

    if(capaciteCompanions !== false) {
      const idLion = armorCapacites.companions.lion?.id || false;
      const idWolf = armorCapacites.companions.wolf?.id || false;
      const idCrow = armorCapacites.companions.crow?.id || false;
      let id = 0;

      if(idLion !== false) id = idLion;
      if(idWolf !== false) id = {id1:idWolf.id1, id2:idWolf.id2, id3:idWolf.id3};
      if(idCrow !== false) id = idCrow;

      if(idLion !== false || idCrow !== false) {
        const actorCompanion = game?.actors?.get(id) || false;

        if(actorCompanion !== false) {
          this._gainPE(actorCompanion.system.energie.value, true);

          await actorCompanion.delete();
        }
      }

      if(idWolf !== false) {
        const actor1Companion = game?.actors?.get(id.id1) || false;
        const actor2Companion = game?.actors?.get(id.id2) || false;
        const actor3Companion = game?.actors?.get(id.id3) || false;

        if(actor1Companion !== false) {
          this._gainPE(actor1Companion.system.energie.value, true);

          await actor1Companion.delete();
        }

        if(actor2Companion !== false) {
          await actor2Companion.delete();
        }

        if(actor3Companion !== false) {
          await actor3Companion.delete();
        }
      }

      armure.update({[`system.capacites.selected.companions.active`]:{
        'base':false,
        'lion':false,
        'wolf':false,
        'crow':false
      }});
    }

    capacites.system.equipements.armure.capacites.borealis.support = false;
    capacites.system.equipements.armure.capacites.borealis.offensif = false;
    capacites.system.equipements.armure.capacites.borealis.utilitaire = false;
    capacites.system.equipements.armure.capacites.borealis.allie = 0;

    capacites.system.equipements.armure.capacites.changeling.personnel = false;
    capacites.system.equipements.armure.capacites.changeling.etendue = false;

    capacites.system.equipements.armure.capacites.companions.active = false;
    capacites.system.equipements.armure.capacites.companions.lion = false;
    capacites.system.equipements.armure.capacites.companions.wolf = false;
    capacites.system.equipements.armure.capacites.companions.crow = false;

    capacites.system.equipements.armure.capacites.shrine.active = false;
    capacites.system.equipements.armure.capacites.shrine.activePersonnel = false;
    capacites.system.equipements.armure.capacites.shrine.activeDistance = false;
    capacites.system.equipements.armure.capacites.shrine.activePersonnel6 = false;
    capacites.system.equipements.armure.capacites.shrine.activeDistance6 = false;

    capacites.system.equipements.armure.capacites.ghost.conflit = false;
    capacites.system.equipements.armure.capacites.ghost.horsconflit = false;

    capacites.system.equipements.armure.capacites.goliath.active = false;
    capacites.system.equipements.armure.capacites.goliath.metre = 0;
    capacites.system.equipements.armure.champDeForce.bonus.goliath = 0;
    capacites.system.reaction.malus.goliath = 0;
    capacites.system.defense.malus.goliath = 0;

    capacites.system.equipements.armure.capacites.illumination.torch = false;
    capacites.system.equipements.armure.capacites.illumination.lighthouse = false;
    capacites.system.equipements.armure.capacites.illumination.lantern = false;
    capacites.system.equipements.armure.capacites.illumination.blaze = false;
    capacites.system.equipements.armure.capacites.illumination.beacon = false;
    capacites.system.equipements.armure.capacites.illumination.projector = false;

    capacites.system.equipements.armure.capacites.morph.active = false;
    capacites.system.equipements.armure.capacites.morph.nbre = 0;
    capacites.system.equipements.armure.capacites.morph.choisi = false;
    capacites.system.equipements.armure.capacites.morph.vol = false;
    capacites.system.equipements.armure.capacites.morph.phase = false;
    capacites.system.equipements.armure.capacites.morph.etirement = false;
    capacites.system.equipements.armure.capacites.morph.metal = false;
    capacites.system.equipements.armure.capacites.morph.fluide = false;
    capacites.system.equipements.armure.capacites.morph.polymorphie = false;
    capacites.system.equipements.armure.champDeForce.bonus.morph = 0;
    capacites.system.reaction.bonus.morph = 0;
    capacites.system.defense.bonus.morph = 0;

    capacites.system.equipements.armure.capacites.rage.active = false;
    capacites.system.equipements.armure.capacites.rage.niveau.colere = false;
    capacites.system.equipements.armure.capacites.rage.niveau.fureur = false;
    capacites.system.equipements.armure.capacites.rage.niveau.rage = false;
    capacites.system.egide.bonus.rage = 0;
    capacites.system.reaction.malus.rage = 0;
    capacites.system.defense.malus.rage = 0;
    capacites.system.combos.interdits.caracteristiques.rage = [];
    capacites.system.combos.bonus.caracteristiques.rage = [];

    capacites.system.equipements.armure.capacites.warlord.action.allie = false;
    capacites.system.equipements.armure.capacites.warlord.action.porteur = false;
    capacites.system.equipements.armure.capacites.warlord.esquive.allie = false;
    capacites.system.equipements.armure.capacites.warlord.esquive.porteur = false;
    capacites.system.equipements.armure.capacites.warlord.force.allie = false;
    capacites.system.equipements.armure.capacites.warlord.force.porteur = false;
    capacites.system.equipements.armure.capacites.warlord.guerre.allie = false;
    capacites.system.equipements.armure.capacites.warlord.guerre.porteur = false;
    capacites.system.reaction.bonus.warlord = 0;
    capacites.system.defense.bonus.warlord = 0;
    capacites.system.equipements.armure.champDeForce.bonus.warlord = 0;

    capacites.system.equipements.armure.capacites.watchtower = false;

    capacites.system.equipements.armure.capacites.type.soldier.conflit = false;
    capacites.system.equipements.armure.capacites.type.soldier.horsconflit = false;
    capacites.system.equipements.armure.capacites.type.hunter.conflit = false;
    capacites.system.equipements.armure.capacites.type.hunter.horsconflit = false;
    capacites.system.equipements.armure.capacites.type.scholar.conflit = false;
    capacites.system.equipements.armure.capacites.type.scholar.horsconflit = false;
    capacites.system.equipements.armure.capacites.type.herald.conflit = false;
    capacites.system.equipements.armure.capacites.type.herald.horsconflit = false;
    capacites.system.equipements.armure.capacites.type.scout.conflit = false;
    capacites.system.equipements.armure.capacites.type.scout.horsconflit = false;

    capacites.system.aspects.chair.caracteristiques.deplacement.overdrive.bonus.type = 0;
    capacites.system.aspects.chair.caracteristiques.force.overdrive.bonus.type = 0;
    capacites.system.aspects.chair.caracteristiques.endurance.overdrive.bonus.type = 0;
    capacites.system.aspects.bete.caracteristiques.hargne.overdrive.bonus.type = 0;
    capacites.system.aspects.bete.caracteristiques.combat.overdrive.bonus.type = 0;
    capacites.system.aspects.bete.caracteristiques.instinct.overdrive.bonus.type = 0;
    capacites.system.aspects.machine.caracteristiques.tir.overdrive.bonus.type = 0;
    capacites.system.aspects.machine.caracteristiques.savoir.overdrive.bonus.type = 0;
    capacites.system.aspects.machine.caracteristiques.technique.overdrive.bonus.type = 0;
    capacites.system.aspects.dame.caracteristiques.aura.overdrive.bonus.type = 0;
    capacites.system.aspects.dame.caracteristiques.parole.overdrive.bonus.type = 0;
    capacites.system.aspects.dame.caracteristiques.sangFroid.overdrive.bonus.type = 0;
    capacites.system.aspects.masque.caracteristiques.discretion.overdrive.bonus.type = 0;
    capacites.system.aspects.masque.caracteristiques.dexterite.overdrive.bonus.type = 0;
    capacites.system.aspects.masque.caracteristiques.perception.overdrive.bonus.type = 0;


    let rollUi = Object.values(ui.windows).find((app) => app instanceof KnightRollDialog) ?? false;
    const longbow = this.actor?.longbow || false;

    if(rollUi !== false && longbow !== false) {
      await rollUi.setWpnLongbow(longbow);

      rollUi.render(true);
    }

    this.actor.update(capacites);
  }

  async _resetArmureModules() {
    const listModules = this.getData().actor.modules;

    const modules = {
      system:{
        equipements:{
          ascension:{
            armure:{
              bonus:{}
            },
            champDeForce:{
              bonus:{}
            },
            energie:{
              bonus:{}
            },
          },
          armure:{
            armure:{
              bonus:{}
            },
            champDeForce:{
              bonus:{}
            },
            energie:{
              bonus:{}
            },
          }
        }
      }
    }

    for (let i = 0;i < listModules.length;i++){
      const dataModules = listModules[i];
      const getData = this.actor.items.get(dataModules._id);

      modules.system.equipements.ascension.armure.bonus[dataModules._id] = 0;
      modules.system.equipements.armure.armure.bonus[dataModules._id] = 0;
      modules.system.equipements.ascension.champDeForce.bonus[dataModules._id] = 0;
      modules.system.equipements.armure.champDeForce.bonus[dataModules._id] = 0;
      modules.system.equipements.ascension.energie.bonus[dataModules._id] = 0;
      modules.system.equipements.armure.energie.bonus[dataModules._id] = 0;

      if(getData.system.id !== '') {
        const actor = game?.actors?.get(getData.system.id) || false;

        if(actor !== false) await actor.delete();
      }

      getData.update({[`system`]:{
        'active':{
          'pnj':false,
          'pnjName':'',
          'base':false
        },
        'id':''
      }});
    }

    this.actor.update(modules);
  }

  async _resetArmure() {

    await this._resetArmureCapacites();
    await this._resetArmureModules();

    const data = this.getData();
    const idArmure = data.systemData.equipements?.armure?.id || false;
    const remplaceEnergie = this.actor.items.get(idArmure)?.system?.espoir?.remplaceEnergie || false;
    const ascension = data.systemData.equipements.armure.capacites?.ascension?.active || false;

    let capacites = {
      system:{
        equipements:{
          armure:{
            capacites:{
              ascension:{},
              borealis:{},
              changeling:{},
              companions:{},
              shrine:{},
              ghost:{},
              goliath:{},
              illumination:{
                choix:{}
              },
              morph:{},
              warlord:{
                modes:{},
                action:{},
                guerre:{},
                force:{},
                esquive:{}
              }
            }
          }
        }
      }
    }

    if(ascension) {
      const id = this.getData().systemData.equipements.armure.capacites?.ascension?.id || false;
      const depense = +this.getData().data.system.equipements.armure.capacites?.ascension?.depense || 0;

      if(id) {
        const actor = game.actors.get(id);

        await actor.delete();
      }

      capacites.system.equipements.armure.capacites.ascension.active = false;
      capacites.system.equipements.armure.capacites.ascension.id = 0;
      capacites.system.equipements.armure.capacites.ascension.depense = 0;

      if(remplaceEnergie) {
        capacites.system.espoir = {};
        capacites.system.espoir.malus = {armure:this.getData().data.system.espoir.malus.armure-depense};
      } else {
        const selfArmure = this.actor.items.get(this.getData().data.system.equipements.armure.id);

        selfArmure.update({[`system.energie.base`]:this.getData().data.system.energie.max+depense});
      }
    }

    this.actor.update(capacites);
  }

  _getSlotsValue() {
    const sArmure = this.getData().actor.armureData.system.slots;
    const sUtilise = this.getData().data.system.equipements.armure.slots;

    const result = this.getData().data.system.equipements.armure.hasArmor === false ? undefined : {
      tete: sArmure.tete.value-sUtilise.tete,
      torse: sArmure.torse.value-sUtilise.torse,
      brasGauche: sArmure.brasGauche.value-sUtilise.brasGauche,
      brasDroit: sArmure.brasDroit.value-sUtilise.brasDroit,
      jambeGauche: sArmure.jambeGauche.value-sUtilise.jambeGauche,
      jambeDroite: sArmure.jambeDroite.value-sUtilise.jambeDroite
    };

    return result;
  }

  _getArmorId() {
    const data = this.getData();
    const id = data.data.system.equipements.armure.id;

    return id;
  }

  _getArmorLegendeId() {
    const data = this.getData();
    const id = data.data.system.equipements.armure?.idLegende || 0;

    return id;
  }

  _getTotalPG(data) {
    const PG = +data.progression.gloire.total;

    return PG;
  }
}
