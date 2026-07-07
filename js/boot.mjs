/* daikieOS ES-module foundation (SP1).
   Static imports evaluate BEFORE any body statement -> window.THREE + window.POST
   exist first; sequential dynamic import() runs the 5 scene IIFEs in original
   order, each strictly after the shim assignments. */

import * as THREE from 'three';
window.THREE = THREE;

import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
window.POST = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass };

// Same order + ?v= as the old classic <script> tags (index.html:339-343).
const V = { bg: '4.3', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
await import(`./background.js?v=${V.bg}`);
await import(`./boot.js?v=${V.boot}`);
await import(`./cursor.js?v=${V.cursor}`);
await import(`./effects.js?v=${V.fx}`);
await import(`./app.js?v=${V.app}`);
