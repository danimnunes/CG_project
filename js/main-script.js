import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
//import { ParametricGeometries } from 'three/addons/geometries/ParametricGeometries.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////

var camera, scene, renderer, stereoCamera;
var moveAnelGrande = true, moveAnelPequeno = true, moveAnelMedio = true;
var currentShading = 'Gouraud';
var directionalLightOn = true, pontualLightsOn = true, pontualLights = [];
var faixaMobius, controls;
var directionalLight, carrossel, skyDome;
var cilindro, anelGrande = new THREE.Object3D(), anelMedio = new THREE.Object3D(), anelPequeno = new THREE.Object3D();
var meshs = [], spotLights=[], spotLightsOn = true;



/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));
    scene.background = new THREE.Color(0x000000);
    createSkydome();
    createCilindro();
    createAneis();
    createFaixaMobius();
    createSuperficies();
    createCarrossel();
}

const ParametricGeometries = {
    klein: function (u, v, target) {
        u *= Math.PI;
        v *= 2 * Math.PI;
        u = u * 2;
        let x, y, z;
        if (u < Math.PI) {
            x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
            y = 8 * Math.sin(u) + (2 * (1 - Math.cos(u) / 2)) * Math.sin(u) * Math.cos(v);
        } else {
            x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
            y = 8 * Math.sin(u);
        }
        z = (2 * (1 - Math.cos(u) / 2)) * Math.sin(v);
        target.set(x, y, z);
    },
    plane: function (u, v, target) {
        const x = 2 * (u - 0.5);
        const y = 2 * (v - 0.5);
        const z = Math.sin(u * Math.PI) * Math.cos(v * Math.PI);
        target.set(x, y, z);
    },
    torus: function (u, v, target) {
        const radius = 0.7;
        const tube = 0.4;
        const x = (radius + tube * Math.cos(v * Math.PI * 2)) * Math.cos(u * Math.PI * 2);
        const y = (radius + tube * Math.cos(v * Math.PI * 2)) * Math.sin(u * Math.PI * 2);
        const z = tube * Math.sin(v * Math.PI * 2);
        target.set(x, y, z);
    },
    sphere: function (u, v, target) {
        const radius = 1;
        const x = radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
        const y = radius * Math.cos(v * Math.PI);
        const z = radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
        target.set(x, y, z);
    },
    cylinder: function (u, v, target) {
        const radius = 0.75;
        const height = 2.5;
        const x = radius * Math.cos(u * Math.PI * 2);
        const y = height * (v - 0.5);
        const z = radius * Math.sin(u * Math.PI * 2);
        target.set(x, y, z);
    },
    paraboloid: function (u, v, target) {
        const a = 1;
        const b = 1;
        const x = a * Math.sinh(u) * Math.cos(v * Math.PI * 2);
        const y = a * Math.sinh(u) * Math.sin(v * Math.PI * 2);
        const z = b * Math.cosh(u);
        target.set(x, y, z);
    },
    hyperboloid: function (u, v, target) {
        const a = 1;
        const c = 1;
        const x = a * Math.cosh(u) * Math.cos(v * Math.PI * 2);
        const y = a * Math.cosh(u) * Math.sin(v * Math.PI * 2);
        const z = c * Math.sinh(u);
        target.set(x, y, z);
    },
    helicoid: function (u, v, target) {
        const a = 1;
        const b = 0.5;
        const x = a * u * Math.cos(v * Math.PI * 2);
        const y = a * u * Math.sin(v * Math.PI * 2);
        const z = b * v * Math.PI * 2;
        target.set(x, y, z);
    }
};

// Create BufferGeometry from parametric function
function createParametricBufferGeometry(func, slices, stacks) {
    const vertices = [];
    const indices = [];
    const target = new THREE.Vector3();

    for (let i = 0; i <= slices; i++) {
        for (let j = 0; j <= stacks; j++) {
            const u = i / slices;
            const v = j / stacks;
            func(u, v, target);
            vertices.push(target.x, target.y, target.z);
        }
    }

    for (let i = 0; i < slices; i++) {
        for (let j = 0; j < stacks; j++) {
            const a = i * (stacks + 1) + (j + 1);
            const b = i * (stacks + 1) + j;
            const c = (i + 1) * (stacks + 1) + j;
            const d = (i + 1) * (stacks + 1) + (j + 1);
            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
}

function createSuperficies() {
    const surfaces = [
        ParametricGeometries.klein,
        ParametricGeometries.plane,
        ParametricGeometries.torus,
        ParametricGeometries.sphere,
        ParametricGeometries.cylinder,
        ParametricGeometries.paraboloid,
        ParametricGeometries.hyperboloid,
        ParametricGeometries.helicoid
    ];

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff, 0x3d5e6f];
    const numSurfacesPerRing = 8;
    const kleinScaleFactor = 0.3;

    function createSurfacesForRing(ring_no, ring, ringSuperficies, outerRadius, scaleFactor) {
        spotLights[ring_no] = [];
        for (let i = 0; i < numSurfacesPerRing; i++) {
            const surfaceFunc = surfaces[i];
            const color = colors[i];
            const geometry = createParametricBufferGeometry(surfaceFunc, 10, 10);
            const materialLambert = new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide });
            const materialPhong = new THREE.MeshPhongMaterial({ color: color, side: THREE.DoubleSide });
            const materialToon = new THREE.MeshToonMaterial({ color: color, side: THREE.DoubleSide });
            const materialNormal = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
            const materialBasic = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geometry, materialLambert);

            const radius = outerRadius - 3;
            const angleStep = (2 * Math.PI) / numSurfacesPerRing;
            const angle = i * angleStep + (Math.PI / 2)*ring_no;

            // Posiciona a superfície na mesma altura que o anel
            mesh.position.set(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                -2
                
            );
            spotLights[ring_no][i] = new THREE.SpotLight( 0xffffff, 5 );
            spotLights[ring_no][i].position.set(
                radius * Math.cos(angle),
                radius * Math.sin(angle),
                0
                
            );

            spotLights[ring_no][i].target = mesh; // Aponta a luz para a superfície

            // Adiciona a luz à cena
            scene.add(spotLights[ring_no][i]);
            scene.add(spotLights[ring_no][i].target);


            mesh.lookAt(new THREE.Vector3(ring.position.x, ring.position.y, ring.position.z));
            if(i == 0) {
                mesh.scale.set(kleinScaleFactor, kleinScaleFactor, kleinScaleFactor);
            }
            else {
                mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
            }

            mesh.userData = {
                rotationSpeed: Math.random() * 0.02 + 0.01,
                rotationAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                materials: [materialLambert, materialPhong, materialToon, materialNormal, materialBasic]
            };

            ring.add(mesh);
            ring.add(spotLights[ring_no][i]);
            ring.add(spotLights[ring_no][i].target);
            meshs.push(mesh);
            ringSuperficies.push(mesh);
        }
    }

    // Arrays para armazenar as formas de cada anel
    const anelGrandeSuperficies = [];
    const anelMedioSuperficies = [];
    const anelPequenoSuperficies = [];

    // Cria superfícies para cada anel com o raio correto
    createSurfacesForRing(0, anelGrande, anelGrandeSuperficies, 20, 2); // Outer radius of anelGrande is 20
    createSurfacesForRing(1, anelMedio, anelMedioSuperficies, 15, 1.5);  // Outer radius of anelMedio is 15
    createSurfacesForRing(2, anelPequeno, anelPequenoSuperficies, 10, 0.75); // Outer radius of anelPequeno is 10

}


function createSkydome(){
    const skyGeometry = new THREE.SphereGeometry(45, 32, 32, Math.PI/ 2, Math.PI);    
    const skydomePhong = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load('js/skydome.jpg'), // Carregar a textura do frame do vídeo
        side: THREE.BackSide, // A textura é aplicada no lado de fora do skydome
    });
    const skydomeLambert = new THREE.MeshLambertMaterial({
        map: new THREE.TextureLoader().load('js/skydome.jpg'), 
        side: THREE.BackSide, 
    });
    const skydomeToon = new THREE.MeshToonMaterial({
        map: new THREE.TextureLoader().load('js/skydome.jpg'), 
        side: THREE.BackSide, 
    });
    const skydomeNormal = new THREE.MeshNormalMaterial({
        map: new THREE.TextureLoader().load('js/skydome.jpg'), 
        side: THREE.BackSide, 
    });
    const skydomeBasic = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('js/skydome.jpg'), 
        side: THREE.BackSide, 
    });
    
    skyDome = new THREE.Mesh(skyGeometry, skydomeLambert);
    skyDome.userData = {materials: [skydomeLambert, skydomePhong, skydomeToon, skydomeNormal, skydomeBasic]};
    meshs.push(skyDome);
    skyDome.rotation.z = Math.PI / 2; 
    skyDome.position.y = 0;
    scene.add(skyDome);
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////

function createCamera(){
    stereoCamera = new THREE.StereoCamera();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 70, 10);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.x = 0;
    camera.position.y = 50;
    camera.position.z = 45;    
    controls = new OrbitControls(camera, renderer.domElement);

    camera.lookAt(scene.position);
    scene.add(camera);

}


/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function create_Lights(){
    var ambientLight = new THREE.AmbientLight(0xffa500, 3); // Tom alaranjado
    scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 4);
    directionalLight.position.set(0, 12, 12)
    directionalLight.target.position.set(0, 0, 0);

    scene.add(directionalLight);
    directionalLightOn = true;

    const lightColor = 0xffffff;
    const lightIntensity = 10;
    const lightRadius = 9; 

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = lightRadius * Math.cos(angle);
        const z = lightRadius * Math.sin(angle);
        const light = new THREE.PointLight(lightColor, lightIntensity, 10);
        light.position.set(x, 39, z); 
        light.lookAt(faixaMobius.position); 
        pontualLights.push(light);
        scene.add(light);
    }
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCilindro() {
    var materialLambert = new THREE.MeshLambertMaterial({ color: 0xff7800 });
    var materialPhong = new THREE.MeshPhongMaterial({ color: 0xff7800 });
    var materialToon = new THREE.MeshToonMaterial({color: 0xff7800});
    var materialNormal = new THREE.MeshNormalMaterial();
    var materialBasic = new THREE.MeshBasicMaterial({ color: 0xff7800 });
    cilindro = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 30, 100), materialLambert);
    
    cilindro.userData = {materials: [materialLambert, materialPhong, materialToon, materialNormal, materialBasic]};
    meshs.push(cilindro);

    cilindro.position.set(0, 15, 0);
    
    scene.add(cilindro);
}

function createAneis() {
    var anelGrandeLambert = new THREE.MeshLambertMaterial({ color: 0xff9933, side: THREE.DoubleSide });
    var anelGrandePhong = new THREE.MeshPhongMaterial({ color: 0xff9933, side: THREE.DoubleSide });
    var anelGrandeToon = new THREE.MeshToonMaterial({ color: 0xff9933, side: THREE.DoubleSide });
    var anelGrandeNormal = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
    var anelGrandeBasic = new THREE.MeshBasicMaterial({ color: 0xff9933, side: THREE.DoubleSide });
    const ringShape = new THREE.Shape();

    ringShape.moveTo(20, 0);
    ringShape.absarc(0, 0, 20, 0, 2 * Math.PI, false);

    // buraco para o círculo interno
    const holePath = new THREE.Path();
    holePath.moveTo(15, 0);
    holePath.absarc(0, 0, 15, 0, 2 * Math.PI, true);

    // subtrai o círculo interno do externo
    ringShape.holes.push(holePath);

    const extrudeSettings = {
        steps: 1,
        depth: 5, 
        bevelEnabled: false
    };

    // Criação da geometria extrudada
    anelGrande = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape, extrudeSettings), anelGrandeLambert);
    meshs.push(anelGrande);
    var anelMedioLambert = new THREE.MeshLambertMaterial({ color: 0x0099ff, side: THREE.DoubleSide });
    var anelMedioPhong = new THREE.MeshPhongMaterial({ color: 0x0099ff, side: THREE.DoubleSide });
    var anelMedioToon = new THREE.MeshToonMaterial({ color: 0x0099ff, side: THREE.DoubleSide});
    var anelMedioNormal = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
    var anelMedioBasic = new THREE.MeshBasicMaterial({ color: 0x0099ff, side: THREE.DoubleSide });

    const ringShape2 = new THREE.Shape();

    ringShape2.moveTo(15, 0);
    ringShape2.absarc(0, 0, 15, 0, 2 * Math.PI, false);

    const holePath2 = new THREE.Path();

    // buraco para o círculo interno
    holePath2.moveTo(10, 0);
    holePath2.absarc(0, 0, 10, 0, 2 * Math.PI, true);

    // subtrai o círculo interno do externo
    ringShape2.holes.push(holePath2);

    anelMedio = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape2, extrudeSettings), anelMedioLambert);
    meshs.push(anelMedio);
    var anelPequenoLambert = new THREE.MeshLambertMaterial({ color: 0x99ff99, side: THREE.DoubleSide });
    var anelPequenoPhong = new THREE.MeshPhongMaterial({ color: 0x99ff99, side: THREE.DoubleSide });
    var anelPequenoToon = new THREE.MeshToonMaterial({ color: 0x99ff99, side: THREE.DoubleSide});
    var anelPequenoNormal = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
    var anelPequenoBasic = new THREE.MeshBasicMaterial({ color: 0x99ff99, side: THREE.DoubleSide });

    const ringShape3 = new THREE.Shape();

    ringShape3.moveTo(10, 0);
    ringShape3.absarc(0, 0, 10, 0, 2 * Math.PI, false);

    const holePath3 = new THREE.Path();

    // buraco para o círculo interno
    holePath3.moveTo(5, 0);
    holePath3.absarc(0, 0, 5, 0, 2 * Math.PI, true);

    // subtrai o círculo interno do externo
    ringShape3.holes.push(holePath3);

    anelPequeno = new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape3, extrudeSettings), anelPequenoLambert);
    meshs.push(anelPequeno);

    anelGrande.position.set(0, 5, 0);
    anelMedio.position.set(0, 25, 0);
    anelPequeno.position.set(0, 15, 0);
    
    
     
    anelMedio.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    anelPequeno.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    anelGrande.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

    /*movingUp inicializado a true para quando o botão de mover o anel
    for pressionada ele começar a subir */
    anelGrande.userData = {movingUp: true, movingDown: false, materials: [anelGrandeLambert, anelGrandePhong, anelGrandeToon, anelGrandeNormal, anelGrandeBasic]};
    anelMedio.userData = {movingUp: true, movingDown: false, materials: [anelMedioLambert, anelMedioPhong, anelMedioToon, anelMedioNormal, anelMedioBasic]};
    anelPequeno.userData = {movingUp: true, movingDown: false, materials: [anelPequenoLambert, anelPequenoPhong, anelPequenoToon, anelPequenoNormal, anelPequenoBasic]};
    scene.add(anelGrande);
    scene.add(anelMedio);
    scene.add(anelPequeno);
}

function createFaixaMobius() {
    const mobiusGeometry = new THREE.BufferGeometry();
    const vertices = 
        [7.5, 0, 0,
        10.5, 0, 0,
        6.67, 3.85, -0.75,
        8.92, 5.15, 0.75,
        4.13, 7.14, -1.30,
        4.88, 8.44, 1.30, 
        5.51e-16, 9, -1.5,
        5.51e-16, 9, 1.5, 
        -4.87, 8.44, -1.30,
        -4.12, 7.14, 1.30,
        -8.92, 5.15, -0.75,
        -6.67, 3.85, 0.75,
        -10.5, 1.28e-15, -1.84e-16,
        -7.5, 9.18e-16, 1.84e-16,
        -8.92, -5.15, 0.75,
        -6.67, -3.85, -0.75,
        -4.87, -8.44, 1.30,
        -4.13, -7.14, -1.30,
        -1.65e-15, -9, 1.5,
        -1.65e-15, -9, -1.5,
        4.13, -7.14, 1.30,
        4.87, -8.44, -1.30, 
        6.67, -3.85, 0.75,
        8.92, -5.15, -0.75,
        7.5, -1.84e-15, 3.67e-16,
        10.5, -2.57e-15, -3.67e-16];
    const indices = [0,1,3, 0,2,3,
        2,3,5, 2,4,5,
        4,5,7, 4,6,7,
        6,7,9, 6,8,9,
        8,9,11, 8,10,11,
        10,11,13, 10,12,13,
        12,13,15, 12,14,15,
        14,15,17, 14,16,17,
        16,17,19, 16,18,19,
        18,19,21, 18,20,21,
        20,21,23, 20,22,23,
        22,23,25, 22,24,25];
        
    mobiusGeometry.setIndex(indices);
    mobiusGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mobiusGeometry.computeVertexNormals();

    var materialMobiusLambert = new THREE.MeshLambertMaterial({ color: 0xfdfdfd, wireframe: false, side: THREE.DoubleSide});
    var materialMobiusPhong = new THREE.MeshPhongMaterial({ color: 0xfdfdfd, wireframe: false, side: THREE.DoubleSide});
    var materialMobiusToon = new THREE.MeshToonMaterial({ color: 0xfdfdfd , wireframe: false, side: THREE.DoubleSide});
    var materialMobiusNormal = new THREE.MeshNormalMaterial({ wireframe: false, side: THREE.DoubleSide});
    var materialMobiusBasic = new THREE.MeshBasicMaterial({ color: 0xfdfdfd, wireframe: false, side: THREE.DoubleSide });
    faixaMobius = new THREE.Mesh(mobiusGeometry, materialMobiusLambert); 
    meshs.push(faixaMobius);
    faixaMobius.userData = {materials: [materialMobiusLambert, materialMobiusPhong, materialMobiusToon, materialMobiusNormal, materialMobiusBasic]};
    faixaMobius.position.y = 36; 
    faixaMobius.rotation.x = Math.PI/2; 
    scene.add(faixaMobius);
}

function createCarrossel() {
    carrossel = new THREE.Object3D();
    carrossel.add(anelGrande);
    carrossel.add(anelMedio);
    carrossel.add(anelPequeno);
    carrossel.add(cilindro);
    carrossel.add(faixaMobius);
    carrossel.add(skyDome)
    scene.add(carrossel);
}


///////////////////////
/* ANIMAÇÃO */
///////////////////////


////////////
/* UPDATE */
////////////
function update(){
    'use strict';
    if(moveAnelGrande){
        if(anelGrande.userData.movingUp){
            anelGrande.position.y += 0.1;
            if(anelGrande.position.y >= 30){
                anelGrande.userData.movingUp = false;
                anelGrande.userData.movingDown = true;
            }
        }
        if(anelGrande.userData.movingDown){
            anelGrande.position.y -= 0.1;
            if(anelGrande.position.y <= 5){
                anelGrande.userData.movingUp = true;
                anelGrande.userData.movingDown = false;
            }
        }
    }
    if(moveAnelMedio){
        if(anelMedio.userData.movingUp){
            anelMedio.position.y += 0.1;
            if(anelMedio.position.y >= 30){
                anelMedio.userData.movingUp = false;
                anelMedio.userData.movingDown = true;
            }
        }
        if(anelMedio.userData.movingDown){
            anelMedio.position.y -= 0.1;
            if(anelMedio.position.y <= 5){
                anelMedio.userData.movingUp = true;
                anelMedio.userData.movingDown = false;
            }
        }
    }
    if(moveAnelPequeno){
        if(anelPequeno.userData.movingUp){
            anelPequeno.position.y += 0.1;
            if(anelPequeno.position.y >= 30){
                anelPequeno.userData.movingUp = false;
                anelPequeno.userData.movingDown = true;
            }
        }
        if(anelPequeno.userData.movingDown == true){
            anelPequeno.position.y -= 0.1;
            if(anelPequeno.position.y <= 5){
                anelPequeno.userData.movingUp = true;
                anelPequeno.userData.movingDown = false;
            }
        }
    }

    // Atualiza a rotação das superfícies
    meshs.forEach(mesh => {
        if (mesh.userData.rotationSpeed) {
            mesh.rotateOnAxis(mesh.userData.rotationAxis, mesh.userData.rotationSpeed);
        }
    });

    // CHANGE LIGHTS
    directionalLight.visible = directionalLightOn;
    for (let i = 0; i < 8; i++){
        pontualLights[i].visible = pontualLightsOn;
    }

    for(let ring_no = 0; ring_no < 3; ring_no++){
        for (let i = 0; i < 8; i++){

            if (spotLights[ring_no][i] == undefined) continue;
            spotLights[ring_no][i].visible = !spotLightsOn;
        };
    }

    if (currentShading == 'Gouraud'){
        meshs.forEach(function (mesh) {
            mesh.material = mesh.userData.materials[0];
        });
    } else if (currentShading == 'Phong'){
        meshs.forEach(function (mesh) {
            mesh.material = mesh.userData.materials[1];
        });
    } else if (currentShading == 'Cartoon'){
        meshs.forEach(function (mesh) {
            mesh.material = mesh.userData.materials[2];
        });
    } else if (currentShading == 'NormalMap'){
        meshs.forEach(function (mesh) {
            mesh.material = mesh.userData.materials[3];
        });
    } else if (currentShading == 'Basic'){
        meshs.forEach(function (mesh) {
            mesh.material = mesh.userData.materials[4];
        });
    }

    carrossel.rotation.y += 0.005;

    controls.update();
}

function updateStereoCamera(){
    stereoCamera.update(camera);
}

/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';
    renderer.render(scene, camera);
    updateStereoCamera(); 

    renderer.clear();

}


////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(renderer));

    createScene();
    create_Lights();
    createCamera();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';
    render();

    update();
    // requestAnimationFrame(animate);
    renderer.setAnimationLoop(animate);

    renderer.render(scene, camera);
    
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() { 
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (innerHeight > 0 && innerWidth > 0) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(event) {
    switch (event.keyCode) {

        case 80: //P
        case 112: //p
            pontualLightsOn = !pontualLightsOn;
            break;
        case 83: //S
        case 115: //s
            spotLightsOn = !spotLightsOn;
            break;

        case 81: //Q
        case 113: //q
            currentShading = 'Gouraud';
            break;

        case 68: //D
        case 100: //d
            directionalLightOn = !directionalLightOn;
            break;  
        case 87: //w
        case 119: //W
            currentShading = 'Phong';
            break;
        
        case 69: //E
        case 101: //e
            currentShading = 'Cartoon';
            break;

        case 82: //R
        case 114: //r
            currentShading = 'NormalMap';
            break;

        case 84: //T
        case 116: //t
            if ( currentShading == 'Basic') { currentShading = 'Gouraud'; }
            else {currentShading = 'Basic';}

            break;

        case 49: // Tecla '1' - Anel grande
            moveAnelGrande = !moveAnelGrande;
            break;
        case 50: // Tecla '2' - Anel médio
            moveAnelMedio = !moveAnelMedio;
            break;
        case 51: // Tecla '3' - Anel pequeno
            moveAnelPequeno = !moveAnelPequeno;
            break;
        
    }
}


init();
animate();