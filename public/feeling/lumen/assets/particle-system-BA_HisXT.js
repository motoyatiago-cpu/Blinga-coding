import{S,P as G,C as b,V as r,W as P,a as w,B as M,b as p,c as z,A as D,d as E,E as F,R as T,U as C,e as A,f as k,M as x}from"./three-C9B9pCp0.js";const R=`uniform float uTime;
uniform float uScale;
uniform float uDispersion;
uniform float uExplosion;
uniform float uMode;
uniform float uPreviousMode;
uniform float uMorph;
uniform float uPointSize;
uniform float uHandCount;
uniform float uGesture;
uniform float uGestureStrength;
uniform float uGestureAge;
uniform vec3 uFieldOffset;
uniform vec3 uGesturePoint;
uniform vec3 uGestureDirection;
uniform vec3 uHands[10];
uniform float uHandStrength[10];

attribute vec3 aSeed;
attribute float aSize;
attribute float aPhase;

varying vec3 vColor;
varying float vAlpha;
varying float vSpeed;

#define PI 3.14159265359

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

vec3 galaxy(vec3 s) {
  float arm = floor(s.x * 5.0);
  float radius = pow(s.y, 0.62) * 5.5;
  float angle = radius * 1.65 + arm * (PI * 2.0 / 5.0) + (s.z - 0.5) * 0.85;
  float thickness = (hash31(s.xyz + 2.7) - 0.5) * (0.18 + radius * 0.075);
  return vec3(cos(angle) * radius, thickness, sin(angle) * radius) * 0.92;
}

vec3 nebula(vec3 s) {
  float theta = s.x * PI * 2.0;
  float phi = acos(s.y * 2.0 - 1.0);
  float ribbon = sin(theta * 3.0 + s.z * 9.0) * 0.8;
  float radius = 2.0 + 3.8 * pow(s.z, 0.72) + ribbon;
  vec3 p = vec3(sin(phi) * cos(theta), cos(phi) * 0.68, sin(phi) * sin(theta)) * radius;
  p.x += sin(p.y * 1.4 + theta) * 0.9;
  p.z += cos(p.x * 0.8 - theta) * 0.65;
  return p;
}

vec3 blackHole(vec3 s) {
  float radius = 0.7 + pow(s.y, 0.48) * 5.2;
  float angle = s.x * PI * 2.0 + radius * 2.2;
  float warp = exp(-radius * 0.7);
  return vec3(cos(angle) * radius, (s.z - 0.5) * (0.1 + radius * 0.065) + warp * 0.55, sin(angle) * radius);
}

vec3 explosion(vec3 s) {
  vec3 dir = normalize(s - 0.5 + vec3(0.001));
  float shell = 1.3 + pow(hash31(s.zxy), 0.35) * 4.2;
  return dir * shell;
}

vec3 heart(vec3 s) {
  float t = s.x * PI * 2.0;
  float x = 16.0 * pow(sin(t), 3.0);
  float y = 13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t);
  return vec3(x * 0.16, y * 0.16, (s.z - 0.5) * 0.8);
}

vec3 formation(float mode, vec3 s) {
  if (mode < 0.5) return galaxy(s);
  if (mode < 1.5) return explosion(s);
  if (mode < 2.5) return blackHole(s);
  return nebula(s);
}

void main() {
  vec3 previous = formation(uPreviousMode, aSeed);
  vec3 target = formation(uMode, aSeed);
  vec3 base = mix(previous, target, smoothstep(0.0, 1.0, uMorph));

  float drift = uTime * (0.09 + aPhase * 0.04);
  float cs = cos(drift), sn = sin(drift);
  base.xz = mat2(cs, -sn, sn, cs) * base.xz;

  vec3 noise = vec3(
    sin(uTime * 0.72 + aPhase * 17.0 + base.y * 1.4),
    cos(uTime * 0.53 + aPhase * 11.0 + base.z * 1.7),
    sin(uTime * 0.61 + aPhase * 13.0 + base.x * 1.2)
  );
  base += noise * (0.08 + uDispersion * 0.24);
  base *= uScale * (0.7 + uDispersion * 0.72);

  vec3 radial = normalize(base + vec3(0.001));
  base += radial * uExplosion * (2.0 + aPhase * 6.0);

  vec3 handForce = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    vec3 delta = uHands[i] - base;
    float d2 = dot(delta, delta) + 0.22;
    float reach = smoothstep(7.0, 0.0, d2);
    float polarity = mix(-1.0, 1.0, uHandStrength[i]);
    handForce += normalize(delta) * reach * polarity * (0.18 + uHandStrength[i] * 0.42);
  }
  base += handForce * min(uHandCount, 2.0);

  vec3 gestureDelta = base - uGesturePoint;
  float gestureDistance = length(gestureDelta) + 0.001;
  vec3 gestureForce = vec3(0.0);
  float gestureEnergy = 0.0;

  // Pinch: draw nearby particles into the thumb/index contact point.
  if (uGesture > 2.5 && uGesture < 3.5) {
    float influence = smoothstep(5.5, 0.0, gestureDistance);
    gestureForce -= normalize(gestureDelta) * influence * 1.25;
    gestureEnergy += influence;
  }
  // OK: a repeating energy ring radiates from the closed finger loop.
  else if (uGesture > 3.5 && uGesture < 4.5) {
    float ringRadius = 0.55 + mod(uGestureAge * 1.8, 2.8);
    float ring = exp(-abs(gestureDistance - ringRadius) * 6.0);
    gestureForce += normalize(gestureDelta) * ring * 0.48;
    gestureEnergy += ring;
  }
  // Index: particles align into a bright ray extending from the fingertip.
  else if (uGesture > 4.5 && uGesture < 5.5) {
    float along = dot(gestureDelta, uGestureDirection);
    vec3 closest = uGesturePoint + uGestureDirection * along;
    float lineDistance = length(base - closest);
    float beam = exp(-lineDistance * 3.4) * smoothstep(-1.0, 0.2, along);
    gestureForce += uGestureDirection * beam * 0.95;
    gestureForce += (closest - base) * beam * 0.2;
    gestureEnergy += beam * 1.4;
  }
  // Victory: divide the field into two counter-flowing particle streams.
  else if (uGesture > 5.5 && uGesture < 6.5) {
    float side = aSeed.x < 0.5 ? -1.0 : 1.0;
    gestureForce += vec3(side * (0.55 + aSeed.y), 0.32 + aSeed.z * 0.45, side * 0.18);
    gestureEnergy += 0.38;
  }
  // Rock: high-frequency zig-zag displacement creates an electric arc field.
  else if (uGesture > 6.5 && uGesture < 7.5) {
    float local = smoothstep(5.2, 0.0, gestureDistance);
    float lightning = sin(base.y * 13.0 + aPhase * 21.0 + uTime * 22.0);
    gestureForce += vec3(lightning, sin(lightning * 4.0), -lightning) * local * 0.38;
    gestureEnergy += local * (0.65 + abs(lightning));
  }
  // Thumb up/down: compress the cloud into a directional jet.
  else if (uGesture > 7.5 && uGesture < 9.5) {
    float vertical = uGesture < 8.5 ? 1.0 : -1.0;
    base.xz *= mix(1.0, 0.62, uGestureStrength);
    gestureForce.y += vertical * (0.55 + aSeed.y * 1.55);
    gestureEnergy += 0.45 + aSeed.y * 0.35;
  }
  // Shaka: particles wrap into a travelling toroidal wave.
  else if (uGesture > 9.5 && uGesture < 10.5) {
    float t = aSeed.x * PI * 2.0 + uTime * 0.8;
    float radius = 2.0 + sin(aSeed.y * PI * 2.0 + uTime * 2.0) * 0.35;
    vec3 ringTarget = uGesturePoint + vec3(cos(t) * radius, (aSeed.z - 0.5) * 0.55, sin(t) * radius);
    base = mix(base, ringTarget, uGestureStrength * 0.68);
    gestureEnergy += 0.48;
  }
  // Finger heart: morph the field into a softly pulsing heart silhouette.
  else if (uGesture > 10.5 && uGesture < 11.5) {
    vec3 heartTarget = heart(aSeed) + uGesturePoint * 0.35;
    heartTarget *= 1.0 + sin(uTime * 4.0) * 0.055;
    base = mix(base, heartTarget, uGestureStrength * 0.82);
    gestureEnergy += 0.58;
  }
  // Wave and clap: a single expanding spherical shock front.
  else if ((uGesture > 11.5 && uGesture < 12.5) || (uGesture > 15.5 && uGesture < 16.5)) {
    float speed = uGesture < 13.0 ? 5.2 : 7.0;
    float ringRadius = 0.25 + uGestureAge * speed;
    float shock = exp(-abs(gestureDistance - ringRadius) * 4.5);
    gestureForce += normalize(gestureDelta) * shock * (uGesture < 13.0 ? 0.9 : 1.5);
    gestureEnergy += shock * 1.4;
  }
  // Point: accelerate a local stream along the measured index direction.
  else if (uGesture > 12.5 && uGesture < 13.5) {
    float local = smoothstep(5.8, 0.0, gestureDistance);
    gestureForce += uGestureDirection * local * (0.65 + aSeed.y * 0.65);
    gestureEnergy += local * 0.8;
  }
  // Two palms lifting: introduce buoyancy and slow lateral turbulence.
  else if (uGesture > 13.5 && uGesture < 14.5) {
    gestureForce.y += 0.52 + aSeed.y * 0.7;
    gestureForce.x += sin(uTime + aPhase * 12.0) * 0.16;
    gestureEnergy += 0.34;
  }
  // Raised hands and supernova amplify the existing radial burst.
  else if ((uGesture > 14.5 && uGesture < 15.5) || (uGesture > 16.5 && uGesture < 17.5)) {
    float burst = exp(-uGestureAge * 1.4);
    gestureForce += normalize(base + vec3(0.001)) * burst * (2.0 + aPhase * 3.8);
    gestureEnergy += burst * 1.6;
  }

  base += gestureForce * uGestureStrength;
  base += uFieldOffset;

  vec4 mvPosition = modelViewMatrix * vec4(base, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(uPointSize * aSize * (18.0 / -mvPosition.z), 1.0, 14.0);

  float core = exp(-length(base) * 0.2);
  float energy = clamp(length(handForce) * 2.5 + length(gestureForce) * 0.7 + gestureEnergy + uExplosion * 0.6, 0.0, 1.0);
  vec3 cyan = vec3(0.18, 0.82, 1.0);
  vec3 violet = vec3(0.63, 0.23, 1.0);
  vec3 rose = vec3(1.0, 0.18, 0.58);
  vColor = mix(cyan, violet, smoothstep(0.0, 1.0, aSeed.x));
  vColor = mix(vColor, rose, energy * 0.7 + core * 0.15);
  vAlpha = 0.32 + aSize * 0.2 + core * 0.38;
  vSpeed = energy;
}
`,H=`varying vec3 vColor;
varying float vAlpha;
varying float vSpeed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float radius = length(uv);
  if (radius > 0.5) discard;
  float core = smoothstep(0.18, 0.0, radius);
  float halo = smoothstep(0.5, 0.04, radius);
  vec3 color = vColor * (0.8 + core * 2.6 + vSpeed * 1.5);
  float alpha = halo * vAlpha * (0.55 + core);
  gl_FragColor = vec4(color, alpha);
}
`,m={galaxy:0,explosion:1,blackhole:2,nebula:3},V={none:0,open:1,fist:2,pinch:3,ok:4,index:5,victory:6,rock:7,thumbUp:8,thumbDown:9,shaka:10,fingerHeart:11,wave:12,point:13,lift:14,raised:15,clap:16,supernova:17},l=(v,e,t,s)=>x.lerp(v,e,1-Math.exp(-t*s));class q{count;renderer;scene=new S;camera=new G(52,1,.1,100);composer;material;points;clock=new b;mode="galaxy";morphProgress=1;explosionEnergy=0;lastGestureSequence=0;reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;pixelRatio=Math.min(devicePixelRatio,1.5);lowFpsSeconds=0;scratchVector=new r;gesturePointTarget=new r;gestureDirectionTarget=new r(0,1,0);constructor(e){const t=matchMedia("(max-width: 720px), (pointer: coarse)").matches;this.count=t?18e3:52e3,this.renderer=new P({canvas:e,antialias:!1,alpha:!1,powerPreference:"high-performance"}),this.renderer.setClearColor(131846,1),this.renderer.setPixelRatio(this.pixelRatio),this.renderer.outputColorSpace=w,this.camera.position.set(0,.25,12.8);const s=new M,n=new Float32Array(this.count*3),o=new Float32Array(this.count*3),h=new Float32Array(this.count),c=new Float32Array(this.count);for(let a=0;a<this.count;a+=1){const u=a*3;o[u]=Math.random(),o[u+1]=Math.random(),o[u+2]=Math.random(),h[a]=.45+Math.pow(Math.random(),3)*1.65,c[a]=Math.random()}s.setAttribute("position",new p(n,3)),s.setAttribute("aSeed",new p(o,3)),s.setAttribute("aSize",new p(h,1)),s.setAttribute("aPhase",new p(c,1));const f=Array.from({length:10},()=>new r(100,100,100));this.material=new z({vertexShader:R,fragmentShader:H,transparent:!0,blending:D,depthWrite:!1,uniforms:{uTime:{value:0},uScale:{value:1},uDispersion:{value:.48},uExplosion:{value:0},uMode:{value:0},uPreviousMode:{value:0},uMorph:{value:1},uPointSize:{value:t?3.1:3.5},uHandCount:{value:0},uGesture:{value:0},uGestureStrength:{value:0},uGestureAge:{value:0},uFieldOffset:{value:new r},uGesturePoint:{value:new r},uGestureDirection:{value:new r(0,1,0)},uHands:{value:f},uHandStrength:{value:new Float32Array(10)}}}),this.points=new E(s,this.material),this.points.frustumCulled=!1,this.scene.add(this.points),this.composer=new F(this.renderer),this.composer.addPass(new T(this.scene,this.camera)),this.composer.addPass(new C(new A(innerWidth,innerHeight),t?.8:1.05,.72,.12));const d=new k;d.uniforms.damp.value=this.reducedMotion?.72:.86,this.composer.addPass(d),this.resize(),this.composer.render()}setMode(e,t=!1){e===this.mode&&!t||(this.material.uniforms.uPreviousMode.value=m[this.mode],this.mode=e,this.material.uniforms.uMode.value=m[e],this.morphProgress=0,(e==="explosion"||t)&&this.triggerExplosion(t?1.35:.85))}triggerExplosion(e=1){this.explosionEnergy=Math.max(this.explosionEnergy,e)}update(e){const t=Math.min(this.clock.getDelta(),.05),s=this.clock.elapsedTime,n=this.material.uniforms;n.uTime.value=s,this.morphProgress=Math.min(1,this.morphProgress+t*(this.reducedMotion?8:.72)),n.uMorph.value=this.morphProgress;const o=e.handCount>=2,h=o?x.mapLinear(e.distance,.08,1,.58,1.48):1;let c=e.handCount?.2+e.openness*.92:.48+Math.sin(s*.22)*.08;e.gesture.name==="open"&&(c=1.18),e.gesture.name==="fist"&&(c=.06),n.uScale.value=l(n.uScale.value,h,3.1,t),n.uDispersion.value=l(n.uDispersion.value,c,3.8,t);const f=e.handCount?new r(e.midpoint.x*.34,e.midpoint.y*.34,e.midpoint.z*.08):new r(Math.sin(s*.13)*.18,Math.cos(s*.17)*.12,0);n.uFieldOffset.value.lerp(f,1-Math.exp(-2.4*t)),n.uHandCount.value=l(n.uHandCount.value,e.handCount,7,t),n.uGesture.value=V[e.gesture.name],n.uGestureAge.value=e.gesture.age;const d=this.reducedMotion?e.gesture.intensity*.45:e.gesture.intensity;n.uGestureStrength.value=l(n.uGestureStrength.value,d,9,t),this.gesturePointTarget.set(e.gesture.anchor.x,e.gesture.anchor.y,e.gesture.anchor.z),this.gestureDirectionTarget.set(e.gesture.direction.x,e.gesture.direction.y,e.gesture.direction.z),n.uGesturePoint.value.lerp(this.gesturePointTarget,1-Math.exp(-10*t)),this.gestureDirectionTarget.lengthSq()>.001&&n.uGestureDirection.value.lerp(this.gestureDirectionTarget,1-Math.exp(-12*t)).normalize(),e.gesture.sequence!==this.lastGestureSequence&&(this.lastGestureSequence=e.gesture.sequence,e.gesture.name==="raised"&&this.triggerExplosion(1.05),e.gesture.name==="clap"&&this.triggerExplosion(1.35),e.gesture.name==="supernova"&&this.triggerExplosion(1.8));const a=n.uHands.value,u=n.uHandStrength.value;let i=0;for(const y of e.hands)for(const g of y.landmarks.slice(0,5)){if(i>=10)break;this.scratchVector.set(g.x,g.y,g.z),a[i].lerp(this.scratchVector,.42),u[i]=l(u[i],g.strength,8,t),i+=1}for(;i<10;i+=1)a[i].set(100,100,100),u[i]=0;return e.expansionVelocity>1.15&&e.openness>.55&&this.triggerExplosion(Math.min(e.expansionVelocity*.5,1.6)),this.mode==="blackhole"&&o&&e.distance<.24&&(n.uDispersion.value=l(n.uDispersion.value,.05,7,t),n.uScale.value=l(n.uScale.value,.48,6,t)),this.explosionEnergy=Math.max(0,this.explosionEnergy-t*.54),n.uExplosion.value=this.reducedMotion?this.explosionEnergy*.25:this.explosionEnergy,this.points.rotation.z+=t*(this.mode==="blackhole"?.055:.018),this.points.rotation.x=Math.sin(s*.08)*.12,this.composer.render(),t}adaptQuality(e,t){this.lowFpsSeconds=e<42?this.lowFpsSeconds+t:Math.max(0,this.lowFpsSeconds-t*.5),this.lowFpsSeconds>4&&this.pixelRatio>.85&&(this.pixelRatio=Math.max(.85,this.pixelRatio-.15),this.renderer.setPixelRatio(this.pixelRatio),this.composer.setPixelRatio(this.pixelRatio),this.resize(),this.lowFpsSeconds=0)}resize(){const e=innerWidth,t=innerHeight;this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t,!1),this.composer.setSize(e,t)}dispose(){this.points.geometry.dispose(),this.material.dispose(),this.renderer.dispose()}}export{q as ParticleSystem};
