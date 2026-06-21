/**
 * Somganesh Events - Interactive 3D Helix Portfolio Gallery
 * Powered by Three.js and GSAP.
 */

// --- CONFIGURATION OPTIONS ---
const CONFIG = {
  // Helix Geometry
  radius: 3.2,              // Cylinder radius (expanded horizontally)
  verticalSpacing: 0.85,    // Vertical distance between cards (leaves a clean gap, no overlap)
  scrollSensitivity: 0.0006, // Scroll-to-angle conversion factor
  bendStrength: 1.3,        // Curvature strength (increased for pronounced waves)
  bendSpread: 1.2,          // Distance from center at which cards start bending
  
  // Focus Effects
  focusScale: 1.25,         // Scale multiplier for the active focused card
  focusBrightness: 1.15,    // Exposure/brightness boost for the active card
  unfocusedOpacity: 1.0,    // Opacity of unfocused cards
  autoScrollSpeed: 0.00012,  // Speed of auto drift (radians per frame)
  
  // Physics & Easing
  lerpSpeed: 0.07,          // Easing/damping coefficient for smooth scrolling
  
  // Camera & View
  cameraZ: 6.8,             // Distance of camera from center
  fov: 45,                  // Field of View
  
  // Interactive Hover Tilt
  maxHoverTiltX: 0.15,      // Maximum tilt on X-axis (radians)
  maxHoverTiltY: 0.18,      // Maximum tilt on Y-axis (radians)
  
  // Mobile Settings
  mobile: {
    radius: 2.6,            // Expanded mobile radius to make cards larger and readable
    verticalSpacing: 0.85,  // Spacing to match larger card sizes
    bendSpread: 1.0,
    cameraZ: 7.2,
  }
};

// --- DATASET & METADATA ---
// HOW TO REPLACE WITH YOUR OWN PHOTOS:
// 1. Drop your images (PNG, JPG, WebP) into the `assets/images/` folder.
// 2. Add or modify entries in the `GALLERY_ITEMS` array below.
// 3. Make sure to specify the correct relative URL in the `url` field.
// 4. Update the `title` and `category` fields to display custom information in the UI focus panel.
// 5. The spiral will automatically scale to support any number of images you add!
const GALLERY_ITEMS = [
  { url: 'images/image_1.webp', title: 'Floral Symphony', category: 'Grand Entrance' },
  { url: 'images/image_2.webp', title: 'Whispering Pines', category: 'Outdoor Reception' },
  { url: 'images/image_3.webp', title: 'Golden Hour Gala', category: 'Celebration' },
  { url: 'images/image_4.webp', title: 'Crystal Elegance', category: 'Ballroom Decor' },
  { url: 'images/image_5.webp', title: 'Ethereal Canopy', category: 'Wedding Altar' },
  { url: 'images/image_6.webp', title: 'Botanical Arch', category: 'Garden Ceremony' },
  { url: 'images/image_7.webp', title: 'Chandelier Dream', category: 'Luxury Stage' },
  { url: 'images/image_8.webp', title: 'Monochromatic Chic', category: 'Minimalist Dinner' },
  { url: 'images/image_9.webp', title: 'Sunset Lounge', category: 'Cabana Lounge' },
  { url: 'images/image_10.webp', title: 'Luminous Night', category: 'Evening Banquet' },
  { url: 'images/image_11.webp', title: 'Enchanted Forest', category: 'Theme Decor' },
  { url: 'images/image_12.webp', title: 'Opulent Banquet', category: 'Rehearsal Dinner' },
  { url: 'images/image_13.webp', title: 'Garden Splendor', category: 'Floral Arch' },
  { url: 'images/image_14.webp', title: 'Sleek Reception', category: 'Modern Design' },
  { url: 'images/image_15.webp', title: 'Ivory Whimsy', category: 'Ceiling Installation' },
  { url: 'images/image_16.webp', title: 'Celestial Night', category: 'Reception Stage' },
  { url: 'images/image_17.webp', title: 'Golden Canopy', category: 'Dinner Decor' },
  { url: 'images/image_19.webp', title: 'Lush Meadows', category: 'Aisle Florals' },
  { url: 'images/image_20.webp', title: 'Candlelit Pathway', category: 'Intimate Dinner' },
  { url: 'images/image_21.webp', title: 'Majestic Stage', category: 'Grand Celebration' },
  { url: 'images/image_22.webp', title: 'Royal Gateway', category: 'Entrance Decor' },
  { url: 'images/image_23.webp', title: 'Starlight Banquet', category: 'Luxury Tent' }
];

// --- SHADER DEFINITIONS ---
const vertexShader = `
  uniform float uRadius;
  uniform float uThetaC;
  uniform float uYC;
  uniform float uZC;
  uniform float uXOffset;
  uniform float uTiltX;
  uniform float uTiltY;
  uniform float uBendFactor;
  uniform float uScale;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    
    // Scale local vertices
    vec3 localPos = position * uScale;
    
    // Apply local rotations (tilts)
    // 1. Rotate around X-axis (TiltX)
    float cx = cos(uTiltX);
    float sx = sin(uTiltX);
    vec3 posAfterX = vec3(
      localPos.x,
      localPos.y * cx - localPos.z * sx,
      localPos.y * sx + localPos.z * cx
    );
    
    // 2. Rotate around Y-axis (TiltY)
    float cy = cos(uTiltY);
    float sy = sin(uTiltY);
    vec3 posRotated = vec3(
      posAfterX.x * cy + posAfterX.z * sy,
      posAfterX.y,
      -posAfterX.x * sy + posAfterX.z * cy
    );
    
    // Cylindrical coordinates projection
    // Center of the card on the cylinder is at angle uThetaC
    // Vertex is displaced horizontally by posRotated.x
    float safeRadius = uRadius == 0.0 ? 1.0 : uRadius;
    float theta = uThetaC - (posRotated.x / safeRadius);
    
    // 3. Bent cylinder position (with radial depth projection of rotated offsets and diagonal offset)
    vec3 posBent = vec3(
      -(uRadius + posRotated.z) * sin(theta) + uXOffset,
      uYC + posRotated.y,
      uZC + (uRadius + posRotated.z) * cos(theta)
    );
    
    // 4. Flat tangent position (with radial depth projection of rotated offsets and diagonal offset)
    vec3 posFlat = vec3(
      -(uRadius + posRotated.z) * sin(uThetaC) + posRotated.x * cos(uThetaC) + uXOffset,
      uYC + posRotated.y,
      uZC + (uRadius + posRotated.z) * cos(uThetaC) + posRotated.x * sin(uThetaC)
    );
    
    // Interpolate between flat and bent states
    vec3 finalPos = mix(posFlat, posBent, uBendFactor);
    
    gl_Position = projectionMatrix * viewMatrix * vec4(finalPos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uBrightness;
  uniform float uBlur; // 0.0 = clear, 1.0 = maximum blur
  uniform float uAspect; // Aspect ratio of the card
  varying vec2 vUv;

  float roundedRectDist(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  void main() {
    vec2 uv = vUv;
    
    // Apply rounded corners mask in local coordinate space
    vec2 p = uv - vec2(0.5);
    vec2 size = vec2(uAspect, 1.0);
    vec2 localCoord = p * size;
    vec2 b = size * 0.5;
    float r = 0.06; // Corner radius (adjust for curvature depth)
    
    float dist = roundedRectDist(localCoord, b, r);
    float edgeAlpha = 1.0 - smoothstep(-0.004, 0.004, dist);
    
    // Discard pixels outside the rounded mask to prevent rendering square corners
    if (edgeAlpha <= 0.0) {
      discard;
    }
    
    vec4 texColor = vec4(0.0);
    
    // Dynamic Box Blur filter proportional to uBlur (0.0 to 1.0)
    float blurStep = uBlur * 0.02; // maximum blur radius
    
    if (blurStep > 0.0) {
      // 9-tap blur kernel with Gaussian weight distribution
      texColor += texture2D(uTexture, uv + vec2(-blurStep, -blurStep)) * 0.09;
      texColor += texture2D(uTexture, uv + vec2(0.0, -blurStep)) * 0.12;
      texColor += texture2D(uTexture, uv + vec2(blurStep, -blurStep)) * 0.09;
      
      texColor += texture2D(uTexture, uv + vec2(-blurStep, 0.0)) * 0.12;
      texColor += texture2D(uTexture, uv + vec2(0.0, 0.0)) * 0.16;
      texColor += texture2D(uTexture, uv + vec2(blurStep, 0.0)) * 0.12;
      
      texColor += texture2D(uTexture, uv + vec2(-blurStep, blurStep)) * 0.09;
      texColor += texture2D(uTexture, uv + vec2(0.0, blurStep)) * 0.12;
      texColor += texture2D(uTexture, uv + vec2(blurStep, blurStep)) * 0.09;
    } else {
      texColor = texture2D(uTexture, uv);
    }
    
    // Apply brightness
    vec3 color = texColor.rgb * uBrightness;
    
    // Gentle card edge vignette to soften boundary aliasing
    float edgeX = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x);
    float edgeY = smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
    float cardVignette = edgeX * edgeY;
    
    gl_FragColor = vec4(color, texColor.a * uOpacity * edgeAlpha * (0.8 + 0.2 * cardVignette));
  }
`;

// --- CORE SYSTEM VARIABLES ---
let scene, camera, renderer;
let cardMeshes = [];
let targetScrollAngle = 0;
let currentScrollAngle = 0;
let isMobile = false;

// Scroll & Loop Control
let lastScrollY = 0;
let isWarping = false;
let driftDirection = 1; // 1 = down, -1 = up

// Mobile Drag & Momentum Physics
let touchStartY = 0;
let touchStartTime = 0;
let touchVelocity = 0;
let isDraggingMobile = false;
let lastTouchY = 0;
let scrollVelocity = 0;
let lastScrollAngle = 0;

// Golden Background Particles System
let particlesPoints;
let particleCount = 200;

// Mouse Tracking
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let activeFocusedIndex = -1;

// Mobile 3D Inline Zoom State
let zoomedCardIndex = -1;
let zoomedCardProgress = { value: 0.0 };

// --- INITIALIZATION ---
function init() {
  checkScreenSize();
  
  // 1. Setup Three.js Context
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  
  // Fog for deep dark spatial fading
  scene.fog = new THREE.FogExp2(0x050505, 0.06);
  
  // Create gold background particles
  createParticles();
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera = new THREE.PerspectiveCamera(
    CONFIG.fov,
    width / height,
    0.1,
    100.0
  );
  
  camera.position.set(0, 0, isMobile ? CONFIG.mobile.cameraZ : CONFIG.cameraZ);
  camera.lookAt(0, 0, 0);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // 2. Preload Textures and Initialize meshes
  loadAssets().then(loadedCards => {
    buildGallery(loadedCards);
    setupEvents();
    
    // Center the native scroll position on load
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const S_mid = Math.round((docHeight - winHeight) / 2.0);
    isWarping = true;
    window.scrollTo(0, S_mid);
    lastScrollY = S_mid;
    
    animate();
  });
}

// --- CREATE BACKGROUND PARTICLES ---
function createParticles() {
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const randomSpeeds = new Float32Array(particleCount);
  
  // Distribute particles in a loose cylindrical shell around the helix
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2.0;
    const radius = 3.5 + Math.random() * 5.0; // Place outside/behind the main helix
    const x = Math.sin(theta) * radius;
    const y = (Math.random() - 0.5) * 14.0; // tall vertical spread
    const z = Math.cos(theta) * radius - 1.0;
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    randomSpeeds[i] = 0.2 + Math.random() * 0.8;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Create a canvas texture for smooth round particles instead of squares
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 215, 0, 1.0)'); // Warm gold center
  grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
  grad.addColorStop(1, 'rgba(255, 215, 0, 0.0)'); // Soft fade out
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  const pTexture = new THREE.CanvasTexture(canvas);
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: isMobile ? 0.09 : 0.12,
    map: pTexture,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  particlesPoints = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesPoints);
  
  // Store speeds on the geometry object
  particlesGeometry.randomSpeeds = randomSpeeds;
}

// --- SCREEN DETECTION ---
function checkScreenSize() {
  isMobile = window.innerWidth < 768;
}

// --- ASSET LOADING AND ASPECT RATIO CORRECTION ---
function loadAssets() {
  const loader = new THREE.TextureLoader();
  const promises = GALLERY_ITEMS.map((item, index) => {
    return new Promise((resolve) => {
      loader.load(item.url, (texture) => {
        // Correct texture filter for premium anti-aliasing
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        
        // Calculate original aspect ratio
        const aspect = texture.image.naturalWidth / texture.image.naturalHeight;
        
        resolve({
          texture,
          aspect,
          title: item.title,
          category: item.category,
          index
        });
      }, undefined, () => {
        console.error(`Failed to load image: ${item.url}`);
        resolve(null);
      });
    });
  });
  
  return Promise.all(promises).then(results => results.filter(r => r !== null));
}

// --- BUILD GALLERY MESHES ---
function buildGallery(loadedCards) {
  // Base height of cards in 3D units
  const cardHeight = isMobile ? 1.6 : 2.0;
  
  // Duplicate loadedCards to get 32 cards for a rich 2-turn helix (32 cards, 16-card pitch)
  const duplicatedCards = [];
  while (duplicatedCards.length < 32) {
    loadedCards.forEach((c) => {
      if (duplicatedCards.length < 32) {
        duplicatedCards.push({
          ...c,
          uniqueIndex: duplicatedCards.length
        });
      }
    });
  }
  
  duplicatedCards.forEach((cardData) => {
    // Determine card width from aspect ratio (no stretch or crop)
    const cardWidth = cardHeight * cardData.aspect;
    
    // Segmented plane geometry to support smooth curvature bending
    const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 32, 1);
    
    // Custom shader material mapping helix algorithms
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTexture: { value: cardData.texture },
        uRadius: { value: isMobile ? CONFIG.mobile.radius : CONFIG.radius },
        uThetaC: { value: 0.0 },
        uYC: { value: 0.0 },
        uZC: { value: 0.0 },
        uXOffset: { value: 0.0 },
        uTiltX: { value: 0.0 },
        uTiltY: { value: 0.0 },
        uBendFactor: { value: 0.0 },
        uScale: { value: 1.0 },
        uOpacity: { value: CONFIG.unfocusedOpacity },
        uBrightness: { value: 1.0 },
        uBlur: { value: 0.0 },
        uAspect: { value: cardData.aspect }
      },
      transparent: true,
      depthWrite: true, // Enabled for pixel-perfect 3D depth-buffer sorting
      depthTest: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    
    cardMeshes.push({
      mesh,
      aspect: cardData.aspect,
      title: cardData.title,
      category: cardData.category,
      baseIndex: cardData.uniqueIndex % loadedCards.length,
      uniqueIndex: cardData.uniqueIndex,
      zoomProgress: 0.0,
      tiltX: 0,
      tiltY: 0
    });
  });
  
  // Set total counter in UI
  document.getElementById('total-slides').innerText = String(loadedCards.length).padStart(2, '0');
  
  // Calculate the correct visual scale of the images to fit the viewport perfectly
  updateCardDimensions();
}

// --- EVENTS BINDING ---
function setupEvents() {
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize);
  
  // Mouse Cursor tracking
  window.addEventListener('mousemove', handleMouseMove);
  
  // Interactive navigation / Modal triggers
  setupNavigation();
  
  // Lightbox click event on canvas
  const container = document.getElementById('canvas-container');
  container.addEventListener('click', handleCanvasClick);
  
  // Touch swiping dragging listeners on mobile canvas
  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Lightbox Close triggers
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxOverlay = document.getElementById('lightbox-overlay');
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', () => {
      closeLightbox();
    });
  }
  
  // Mouse hover pointer scaling
  const hoverables = document.querySelectorAll('a, button, .submit-btn, .modal-close, .lightbox-close');
  const cursor = document.getElementById('custom-cursor');
  
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// --- LIGHTBOX INTERACTION ---
let raycaster = new THREE.Raycaster();

function handleCanvasClick(e) {
  // On mobile, if a card is currently zoomed in, any click on canvas closes it
  if (isMobile && zoomedCardIndex !== -1) {
    closeZoom();
    return;
  }
  
  // Raycast from camera to click location
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
  let closestCard = null;
  let minDistance = Infinity;
  
  // Math Spacing Variables (16 items per turn)
  const deltaTheta = (2.0 * Math.PI) / 16.0;
  const spacing = isMobile ? CONFIG.mobile.verticalSpacing : CONFIG.verticalSpacing;
  const radius = isMobile ? CONFIG.mobile.radius : CONFIG.radius;
  const pitchFactor = spacing / deltaTheta;
  const L = cardMeshes.length * spacing;
  
  // Viewport visible height and width in 3D units at focus plane
  const cameraZ = isMobile ? CONFIG.mobile.cameraZ : CONFIG.cameraZ;
  const visibleHeight = 2.0 * cameraZ * Math.tan((CONFIG.fov / 2.0) * Math.PI / 180.0);
  const visibleWidth = visibleHeight * camera.aspect;
  const yEdge = visibleHeight / 2.0;
  
  cardMeshes.forEach((card, i) => {
    // Reconstruct exact center position and normal orientation of each card
    const baseTheta = i * deltaTheta;
    let theta = baseTheta - currentScrollAngle;
    
    // Calculate vertical position proportional to angle
    let cy = theta * pitchFactor;
    
    // Infinite wrapping modulo to keep Y in range [-L/2, L/2]
    const halfL = L / 2.0;
    cy = ((cy + halfL) % L);
    if (cy < 0.0) cy += L;
    cy -= halfL;
    
    const wrappedTheta = cy / pitchFactor;
    const cosTheta = Math.cos(wrappedTheta);
    
    const spread = isMobile ? CONFIG.mobile.bendSpread : CONFIG.bendSpread;
    const focusFactor = Math.exp(-Math.pow(cy / spread, 2.0));
    const scaleVal = 1.0 + (CONFIG.focusScale - 1.0) * focusFactor;
    const zVal = focusFactor * 0.4;
    
    // Calculate xOffset using the mobile/desktop custom paths
    let xPath;
    if (isMobile) {
      const yNorm = cy / yEdge;
      xPath = visibleWidth * (0.6 * Math.pow(yNorm, 2) + 0.15 * yNorm - 0.45);
    } else {
      const yNorm = cy / yEdge;
      const cardWidthRatio = (card.width * scaleVal) / visibleWidth;
      const maxCenterOffset = visibleWidth * (0.20 - cardWidthRatio / 2.0);
      xPath = maxCenterOffset * (Math.pow(yNorm, 3) - 0.75 * yNorm) / 0.25;
    }
    
    // Center point in world space
    const cx_val = xPath;
    const cz_val = zVal + radius * cosTheta;
    const C = new THREE.Vector3(cx_val, cy, cz_val);
    
    // Normal vector at the center of the card
    const N = new THREE.Vector3(-Math.sin(wrappedTheta), 0, Math.cos(wrappedTheta));
    
    // Define the card's flat tangent plane
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(N, C);
    
    const intersectPoint = new THREE.Vector3();
    const hasIntersection = raycaster.ray.intersectPlane(plane, intersectPoint);
    
    if (hasIntersection) {
      // Calculate local basis coordinates (U, V) on the card plane
      const T = new THREE.Vector3(Math.cos(wrappedTheta), 0, Math.sin(wrappedTheta));
      const V = new THREE.Vector3(0, 1, 0);
      
      const diff = new THREE.Vector3().subVectors(intersectPoint, C);
      const u = diff.dot(T);
      const v = diff.dot(V);
      
      const W = card.width * scaleVal;
      const H = card.height * scaleVal;
      
      // Check if intersection point lies within the boundaries of the card
      if (Math.abs(u) <= W / 2.0 && Math.abs(v) <= H / 2.0) {
        const distance = raycaster.ray.origin.distanceTo(intersectPoint);
        if (distance < minDistance) {
          minDistance = distance;
          closestCard = card;
        }
      }
    }
  });
  
  if (closestCard) {
    if (isMobile) {
      openZoom(closestCard.uniqueIndex);
    } else {
      const src = closestCard.mesh.material.uniforms.uTexture.value.image.src;
      openLightbox(src);
    }
  }
}

function openLightbox(src) {
  const overlay = document.getElementById('lightbox-overlay');
  const img = document.getElementById('lightbox-img');
  if (overlay && img) {
    img.src = src;
    overlay.classList.add('active');
    document.getElementById('custom-cursor').classList.add('hidden');
  }
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.getElementById('custom-cursor').classList.remove('hidden');
  }
}

// --- MOBILE 3D INLINE ZOOM FUNCTIONS ---
function openZoom(index) {
  const card = cardMeshes.find(c => c.uniqueIndex === index);
  if (!card) return;
  
  zoomedCardIndex = index;
  
  // Set focus UI immediately to the clicked card
  activeFocusedIndex = cardMeshes.indexOf(card);
  updateFocusUI(card);
  
  gsap.killTweensOf(card);
  gsap.killTweensOf(zoomedCardProgress);
  
  // Interpolate zoomProgress to 1.0
  gsap.to(card, {
    zoomProgress: 1.0,
    duration: 0.65,
    ease: "power2.out"
  });
  
  // Fade out other cards in parallel by animating zoomedCardProgress.value to 1.0
  gsap.to(zoomedCardProgress, {
    value: 1.0,
    duration: 0.5,
    ease: "power2.out"
  });
}

function closeZoom() {
  if (zoomedCardIndex === -1) return;
  
  const card = cardMeshes.find(c => c.uniqueIndex === zoomedCardIndex);
  if (!card) return;
  
  gsap.killTweensOf(card);
  gsap.killTweensOf(zoomedCardProgress);
  
  // Interpolate zoomProgress back to 0.0
  gsap.to(card, {
    zoomProgress: 0.0,
    duration: 0.65,
    ease: "power2.inOut",
    onComplete: () => {
      zoomedCardIndex = -1;
    }
  });
  
  // Fade in other cards by animating zoomedCardProgress.value back to 0.0
  gsap.to(zoomedCardProgress, {
    value: 0.0,
    duration: 0.5,
    ease: "power2.inOut"
  });
}

// --- SCROLL INPUT HANDLER ---
function handleScroll() {
  const currentScrollY = window.scrollY;
  
  if (isMobile && zoomedCardIndex !== -1) {
    window.scrollTo(0, lastScrollY);
    return;
  }
  
  if (isWarping) {
    lastScrollY = currentScrollY;
    isWarping = false;
    return;
  }
  
  const deltaY = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;
  
  if (deltaY !== 0) {
    targetScrollAngle += deltaY * CONFIG.scrollSensitivity;
    
    // Set drift direction based on user scrolling (downwards vs upwards)
    if (deltaY > 0) {
      driftDirection = 1;  // scroll down -> cards move down -> drift moves down
    } else if (deltaY < 0) {
      driftDirection = -1; // scroll up -> cards move up -> drift moves up
    }
  }
  
  // Keep scrollbar within safe range (infinite loop warp)
  checkScrollWrap();
}

// --- SCROLLBAR WARPING LOOP ---
function checkScrollWrap() {
  const currentScrollY = window.scrollY;
  const sens = CONFIG.scrollSensitivity;
  const N = cardMeshes.length;
  
  // 16 items per turn (one and a half turns visible)
  const deltaTheta = (2.0 * Math.PI) / 16.0;
  
  // Scroll pixels corresponding to one full period of the helix
  const S_loop = Math.round((N * deltaTheta) / sens);
  
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const maxScrollY = docHeight - winHeight;
  
  const threshold = 1500;
  
  if (currentScrollY < threshold) {
    isWarping = true;
    window.scrollTo(0, currentScrollY + S_loop);
  } else if (currentScrollY > maxScrollY - threshold) {
    isWarping = true;
    window.scrollTo(0, currentScrollY - S_loop);
  }
}

// --- MOBILE TOUCH SWIPING HANDLERS ---
function handleTouchStart(e) {
  if (isMobile && zoomedCardIndex !== -1) return;
  // Only handle single touch dragging
  if (e.touches.length === 1) {
    isDraggingMobile = true;
    touchStartY = e.touches[0].clientY;
    lastTouchY = touchStartY;
    touchStartTime = performance.now();
    touchVelocity = 0;
  }
}

// --- MOBILE TOUCH SWIPING HANDLERS ---
function handleTouchMove(e) {
  if (isMobile && zoomedCardIndex !== -1) return;
  if (isDraggingMobile && e.touches.length === 1) {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - lastTouchY;
    lastTouchY = currentY;
    
    // Touch drag sensitivity multiplier
    const sensitivity = 0.0016;
    targetScrollAngle -= deltaY * sensitivity; // Reverse touch scroll direction
    
    // Track swipe speed for physics momentum
    const now = performance.now();
    const timeDelta = now - touchStartTime;
    if (timeDelta > 0) {
      touchVelocity = -deltaY / timeDelta;
      touchStartTime = now;
    }
    
    if (e.cancelable) e.preventDefault();
  }
}

function handleTouchEnd(e) {
  if (isMobile && zoomedCardIndex !== -1) return;
  isDraggingMobile = false;
  
  // Apply deceleration momentum on swipe release
  const absVelocity = Math.abs(touchVelocity);
  if (absVelocity > 0.08) {
    const dir = touchVelocity > 0 ? 1 : -1;
    // Math: final swipe inertia added directly to scroll target
    const momentum = Math.min(2.5, absVelocity * 15.0) * dir;
    targetScrollAngle += momentum * 0.55; // Reverse momentum direction
    
    // Shift auto drift direction based on user kinetic swipe direction
    driftDirection = dir > 0 ? 1 : -1; // Reverse drift direction
  }
}


// --- MOUSE TRACKING ---
function handleMouseMove(e) {
  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;
  
  // Normalize screen coordinates to [-1, 1] for tilt math
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

// --- RESIZE HANDLER ---
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  checkScreenSize();
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Reset camera distance
  camera.position.z = isMobile ? CONFIG.mobile.cameraZ : CONFIG.cameraZ;
  
  // Update card sizes dynamically to fit viewport bounds perfectly
  updateCardDimensions();
  
  // Update radius uniform for all cards
  cardMeshes.forEach(card => {
    card.mesh.material.uniforms.uRadius.value = isMobile ? CONFIG.mobile.radius : CONFIG.radius;
  });
}

// --- DYNAMIC CARD SCALE TO FIT VIEWPORT PERFECTLY ---
function updateCardDimensions() {
  const spacing = isMobile ? CONFIG.mobile.verticalSpacing : CONFIG.verticalSpacing;
  const radius = isMobile ? CONFIG.mobile.radius : CONFIG.radius;
  
  // Spacing in angle (16 cards per turn)
  const deltaTheta = (2.0 * Math.PI) / 16.0;
  
  // Safe limits to prevent overlap in both directions (95% size, 5% gap)
  const horizontalLimit = radius * deltaTheta * 0.95;
  const verticalLimit = spacing * 0.95;
  
  // Re-create plane geometries with aspect ratios preserved (no stretch or crop)
  cardMeshes.forEach(card => {
    // Determine target dimensions mathematically to fit both horizontal and vertical limits
    const targetHeight = Math.min(horizontalLimit / card.aspect, verticalLimit);
    const cardWidth = targetHeight * card.aspect;
    
    card.mesh.geometry.dispose();
    card.mesh.geometry = new THREE.PlaneGeometry(cardWidth, targetHeight, 32, 1);
    
    // Store size attributes on card object for dynamic center offset calculations
    card.width = cardWidth;
    card.height = targetHeight;
  });
}

// --- NAVIGATION & MODALS SYSTEM ---
function setupNavigation() {
  const menuContainer = document.getElementById('menu-container');
  const menuBtn = document.getElementById('menu-btn');
  const menuCloseBtn = document.getElementById('menu-close-btn');
  
  const menuLinkWork = document.getElementById('menu-link-work');
  const menuLinkAbout = document.getElementById('menu-link-about');
  const menuLinkContact = document.getElementById('menu-link-contact');
  
  // Sub-panels
  const panelMenu = document.getElementById('panel-menu');
  const panelAbout = document.getElementById('panel-about');
  const panelContact = document.getElementById('panel-contact');
  
  const aboutBackBtn = document.getElementById('about-back-btn');
  const contactBackBtn = document.getElementById('contact-back-btn');
  
  function openMenu() {
    menuContainer.classList.add('opened');
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  
  function closeMenu() {
    menuContainer.classList.remove('opened');
    menuBtn.setAttribute('aria-expanded', 'false');
    // Smoothly reset back to the main links panel when closed
    setTimeout(() => {
      resetPanels();
    }, 600); // Reset after closing transition completes
  }
  
  function resetPanels() {
    panelAbout.classList.remove('active');
    panelContact.classList.remove('active');
    panelMenu.classList.add('active');
  }
  
  // Menu Trigger Click Events
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMenu();
  });
  
  menuCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });
  
  // Drawer Link Events
  menuLinkWork.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    
    // Scroll back to center (corresponds to image 0) on Work click
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const S_mid = Math.round((docHeight - winHeight) / 2.0);
    window.scrollTo({ top: S_mid, behavior: 'smooth' });
  });
  
  // Transition to Sub-panels
  menuLinkAbout.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    panelMenu.classList.remove('active');
    panelAbout.classList.add('active');
  });
  
  menuLinkContact.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    panelMenu.classList.remove('active');
    panelContact.classList.add('active');
  });
  
  // Back buttons click handlers
  aboutBackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    panelAbout.classList.remove('active');
    panelMenu.classList.add('active');
  });
  
  contactBackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    panelContact.classList.remove('active');
    panelMenu.classList.add('active');
  });
  
  // Press Escape to close menu
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (menuContainer.classList.contains('opened')) {
        closeMenu();
      }
    }
  });
  
  // Click outside menu drawer to close it
  window.addEventListener('click', (e) => {
    if (menuContainer.classList.contains('opened')) {
      // Explicitly ignore clicks originating from back buttons
      if (e.target.closest('.menu-back-btn')) return;
      
      const drawerContent = document.getElementById('menu-drawer-content');
      
      // If click is not inside the drawer content and not on the close button, close it
      if (!drawerContent.contains(e.target) && !menuCloseBtn.contains(e.target) && !menuBtn.contains(e.target)) {
        closeMenu();
      }
    }
  });
}

// --- ANIMATE / TICK LOOP ---
function animate() {
  requestAnimationFrame(animate);
  
  // 0. Auto drift continuous scroll
  targetScrollAngle += driftDirection * CONFIG.autoScrollSpeed;
  
  // 1. Smooth Scroll Physics (Lerp)
  currentScrollAngle += (targetScrollAngle - currentScrollAngle) * CONFIG.lerpSpeed;
  
  // 1.5. Calculate scroll speed/velocity (for dynamic motion blur & swirling particles)
  scrollVelocity = currentScrollAngle - lastScrollAngle;
  lastScrollAngle = currentScrollAngle;
  
  // 1.6. Update background golden particles drift & swirl
  if (particlesPoints) {
    particlesPoints.rotation.y += 0.0008;
    particlesPoints.rotation.x += 0.0003;
    
    const positions = particlesPoints.geometry.attributes.position.array;
    const speeds = particlesPoints.geometry.randomSpeeds;
    const swirlForce = Math.abs(scrollVelocity) * 0.20;
    
    for (let i = 0; i < particleCount; i++) {
      // Particles drift upwards, swirling faster when spinning
      positions[i * 3 + 1] += 0.003 * speeds[i] + swirlForce * 0.08;
      
      // Wrap particles vertically
      if (positions[i * 3 + 1] > 7.0) {
        positions[i * 3 + 1] = -7.0;
      }
      
      // Swirl math around cylinder axis
      const px = positions[i * 3];
      const pz = positions[i * 3 + 2];
      const angle = Math.atan2(px, pz) + (0.0015 * speeds[i]) + (swirlForce * 0.04);
      const r = Math.sqrt(px * px + pz * pz);
      
      positions[i * 3] = Math.sin(angle) * r;
      positions[i * 3 + 2] = Math.cos(angle) * r;
    }
    particlesPoints.geometry.attributes.position.needsUpdate = true;
  }
  
  // 2. Cursor Trailer Easing (skip on mobile)
  if (!isMobile) {
    const cursor = document.getElementById('custom-cursor');
    const dot = document.getElementById('cursor-dot');
    
    if (cursor && dot) {
      const currentLeft = parseFloat(cursor.style.left) || 0;
      const currentTop = parseFloat(cursor.style.top) || 0;
      cursor.style.left = `${currentLeft + (mouse.targetX - currentLeft) * 0.15}px`;
      cursor.style.top = `${currentTop + (mouse.targetY - currentTop) * 0.15}px`;
      
      const currentDotLeft = parseFloat(dot.style.left) || 0;
      const currentDotTop = parseFloat(dot.style.top) || 0;
      dot.style.left = `${currentDotLeft + (mouse.targetX - currentDotLeft) * 0.3}px`;
      dot.style.top = `${currentDotTop + (mouse.targetY - currentDotTop) * 0.3}px`;
    }
  }
  
  // 3. Layout Cards along the Helix
  const N = cardMeshes.length;
  
  // Math Spacing Variables (16 items per turn)
  const deltaTheta = (2.0 * Math.PI) / 16.0;
  const spacing = isMobile ? CONFIG.mobile.verticalSpacing : CONFIG.verticalSpacing;
  const radius = isMobile ? CONFIG.mobile.radius : CONFIG.radius;
  const pitchFactor = spacing / deltaTheta; // spacing per radian
  const L = N * spacing; // total Y height of sequence before wrap
  
  // Viewport visible height and width in 3D units at focus plane
  const cameraZ = isMobile ? CONFIG.mobile.cameraZ : CONFIG.cameraZ;
  const visibleHeight = 2.0 * cameraZ * Math.tan((CONFIG.fov / 2.0) * Math.PI / 180.0);
  const visibleWidth = visibleHeight * camera.aspect;
  const yEdge = visibleHeight / 2.0;
  
  let newFocusedIndex = -1;
  let minFocusDist = Infinity;
  
  cardMeshes.forEach((card, i) => {
    // Base mathematical coordinates along the helix
    const baseTheta = i * deltaTheta;
    let theta = baseTheta - currentScrollAngle;
    
    // Calculate vertical position proportional to angle
    let y = theta * pitchFactor;
    
    // Infinite wrapping modulo to keep Y in range [-L/2, L/2]
    const halfL = L / 2.0;
    y = ((y + halfL) % L);
    if (y < 0.0) y += L;
    y -= halfL;
    
    // Deduce wrapped angle corresponding to wrapped position
    const wrappedTheta = y / pitchFactor;
    
    // Save wrapped vertical position on object for query
    card.yWrapped = y;
    
    // Track focus distance to center (y = 0)
    const distToFocus = Math.abs(y);
    if (distToFocus < minFocusDist) {
      minFocusDist = distToFocus;
      newFocusedIndex = i;
    }
    
    // 4. Calculate dynamic attributes based on focus
    const spread = isMobile ? CONFIG.mobile.bendSpread : CONFIG.bendSpread;
    
    // Gaussian falloff for clean center magnification
    const focusFactor = Math.exp(-Math.pow(y / spread, 2.0));
    
    // Enforce 100% cylindrical curvature so tangent planes do not intersect/overlap
    const bendVal = 1.0;
    
    // Active Scale scaling
    const scaleVal = 1.0 + (CONFIG.focusScale - 1.0) * focusFactor;
    
    // Z-axis focal boost to bring the active card in front
    const zVal = focusFactor * 0.4;
    
    // Smooth falloff for image opacity
    let opacityVal = CONFIG.unfocusedOpacity + (1.0 - CONFIG.unfocusedOpacity) * focusFactor;
    
    // Fade out at the back of the cylinder to prevent wrapping pop
    const cosTheta = Math.cos(wrappedTheta);
    const fadeFactor = THREE.MathUtils.smoothstep(cosTheta, -0.85, -0.5);
    opacityVal *= fadeFactor;
    
    // Brightness highlight
    const brightVal = 1.0 + (CONFIG.focusBrightness - 1.0) * focusFactor;
    
    // Calculate blur based on 3D depth, screen vertical edges, and scroll velocity
    const wrappedZ = radius * cosTheta;
    const depthBlur = Math.max(0.0, Math.min(1.0, (radius - wrappedZ) / (2.0 * radius)));
    const edgeBlur = Math.min(1.0, Math.abs(y) / yEdge);
    
    // Dynamic motion blur proportional to scroll speed
    const velocityBlur = Math.min(0.55, Math.abs(scrollVelocity) * 20.0);
    const blurVal = Math.max(depthBlur, edgeBlur, velocityBlur);
    
    // Calculate xOffset using the 3rd-order odd polynomial mapping with 30%-70% boundary clamps (desktop) or curved axis (mobile)
    const yNorm = y / yEdge;
    let xPath;
    if (isMobile) {
      xPath = visibleWidth * (0.6 * Math.pow(yNorm, 2) + 0.15 * yNorm - 0.45);
    } else {
      // Dynamically calculate maxCenterOffset so card edges align exactly at 30% and 70% of screen width
      const cardWidthRatio = (card.width * scaleVal) / visibleWidth;
      const maxCenterOffset = visibleWidth * (0.20 - cardWidthRatio / 2.0);
      xPath = maxCenterOffset * (Math.pow(yNorm, 3) - 0.75 * yNorm) / 0.25;
    }
    const xOffset = xPath + radius * Math.sin(wrappedTheta);
    
    // Calculate final interpolated zoom properties
    const zoom = card.zoomProgress || 0.0;
    
    let finalTheta = wrappedTheta;
    let finalY = y;
    let finalZ = zVal;
    let finalXOffset = xOffset;
    let finalBend = bendVal;
    let finalScale = scaleVal;
    let finalOpacity = opacityVal;
    let finalBrightness = brightVal;
    let finalBlur = blurVal;
    
    if (isMobile && zoom > 0.0) {
      const targetTheta = 0.0;
      const targetY = 0.0;
      const targetZ = 4.8;
      const targetXOffset = 0.0;
      const targetBend = 0.0; // flat plane
      
      const distToCam = cameraZ - targetZ;
      const visH = 2.0 * distToCam * Math.tan((CONFIG.fov / 2.0) * Math.PI / 180.0);
      const visW = visH * camera.aspect;
      const scaleToFitH = (visH * 0.88) / card.height;
      const scaleToFitW = (visW * 0.88) / card.width;
      const targetScale = Math.min(scaleToFitH, scaleToFitW);
      
      finalTheta = THREE.MathUtils.lerp(wrappedTheta, targetTheta, zoom);
      finalY = THREE.MathUtils.lerp(y, targetY, zoom);
      finalZ = THREE.MathUtils.lerp(zVal, targetZ, zoom);
      finalXOffset = THREE.MathUtils.lerp(xOffset, targetXOffset, zoom);
      finalBend = THREE.MathUtils.lerp(bendVal, targetBend, zoom);
      finalScale = THREE.MathUtils.lerp(scaleVal, targetScale, zoom);
      
      finalOpacity = THREE.MathUtils.lerp(opacityVal, 1.0, zoom);
      finalBrightness = THREE.MathUtils.lerp(brightVal, 1.0, zoom);
      finalBlur = THREE.MathUtils.lerp(blurVal, 0.0, zoom);
    }
    
    // Apply opacity fade out for other cards when zoomed
    if (isMobile && zoomedCardIndex !== -1) {
      if (card.uniqueIndex !== zoomedCardIndex) {
        finalOpacity *= (1.0 - zoomedCardProgress.value * 0.9); // fade down others to 10%
      }
    }
    
    // 5. Update Uniform values
    const uniforms = card.mesh.material.uniforms;
    uniforms.uThetaC.value = finalTheta;
    uniforms.uYC.value = finalY;
    uniforms.uZC.value = finalZ;
    uniforms.uXOffset.value = finalXOffset;
    uniforms.uBendFactor.value = finalBend;
    uniforms.uScale.value = finalScale;
    uniforms.uOpacity.value = finalOpacity;
    uniforms.uBrightness.value = finalBrightness;
    uniforms.uBlur.value = finalBlur;
    
    // 6. Local Interactive Tilt Easing (on mouse hover)
    // Only apply mouse-tilt to the focused card on Desktop
    let targetTiltX = 0;
    let targetTiltY = 0;
    
    if (!isMobile && i === activeFocusedIndex) {
      targetTiltX = mouse.y * CONFIG.maxHoverTiltX;
      targetTiltY = mouse.x * CONFIG.maxHoverTiltY;
    }
    
    // Mobile roll-deck rotation around X-axis for extra depth
    if (isMobile) {
      targetTiltX = THREE.MathUtils.lerp(-y * 0.08, 0.0, zoom);
    }
    
    card.tiltX += (targetTiltX - card.tiltX) * 0.08;
    card.tiltY += (targetTiltY - card.tiltY) * 0.08;
    
    uniforms.uTiltX.value = card.tiltX;
    uniforms.uTiltY.value = card.tiltY;
  });
  
  // 7. Update slide counter in footer if focus card shifted
  if (newFocusedIndex !== -1 && newFocusedIndex !== activeFocusedIndex) {
    activeFocusedIndex = newFocusedIndex;
    updateFocusUI(cardMeshes[activeFocusedIndex]);
  }
  
  // 8. Execute Render
  renderer.render(scene, camera);
}

// --- UPDATE FOCUS UI ---
function updateFocusUI(card) {
  // Update slide counter in footer
  const slideNumEl = document.getElementById('current-slide');
  if (slideNumEl) slideNumEl.innerText = String(card.baseIndex + 1).padStart(2, '0');
  
  // Haptic feedback pulse on mobile devices when locking in focus
  if (isMobile && navigator.vibrate) {
    try {
      navigator.vibrate(12); // Short clean tactile tick
    } catch (e) {
      // Vibrate is blocked by some security sandboxes, fail silently
    }
  }
}

// --- KICKSTART SCENE ---
window.addEventListener('DOMContentLoaded', init);
