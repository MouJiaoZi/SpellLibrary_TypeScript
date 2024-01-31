import 'utils/index';
import { ActivateModules } from './modules';
import Precache from './utils/precache';

require('hero_demo/demo_core');
require('./lib/util');
require('./lib/lua_util');

if (GameRules.IsCheatMode()) {
    HeroDemo.Init();
}

Object.assign(getfenv(), {
    Activate: () => {
        ActivateModules();
    },
    Precache: Precache,
});
